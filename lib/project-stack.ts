import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import { LambdaIntegration, AuthorizationType } from '@aws-cdk/aws-apigateway';
import { AssetCode, Function, Runtime, StartingPosition } from '@aws-cdk/aws-lambda';
import * as dynamo from '@aws-cdk/aws-dynamodb'
import { DynamoEventSource, SqsDlq, SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import {CognitoUserPool} from './cognito-userpool/cognito-userpool'
import {ApiResource} from './rest-api/rest-api'
import * as logs from '@aws-cdk/aws-logs';

export class ProjectStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool .
    const cognitoUserPool: CognitoUserPool = new CognitoUserPool(this, 'CognitoUserPool');
    const catalogResource:ApiResource = new ApiResource(this,"CatalogApiResourcec",cognitoUserPool);

        //Dynamo DB for storing product data

    const dynamoTable = new dynamo.Table(this, 'productsTable', {
          partitionKey: {
            name: 'id',
            type: dynamo.AttributeType.STRING
          },
          tableName: 'productsTable',
          encryption : dynamo.TableEncryption.DEFAULT,
          billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
          stream: dynamo.StreamViewType.NEW_AND_OLD_IMAGES
        });
    // Function for list products"
    /**const listProductsFunction = new Function(this, 'listProducts', {
      code: new AssetCode('listproducts'),
      handler: 'listProducts.handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: cdk.Duration.seconds(3),
      memorySize: 512,
      environment : {
        "tableName" : dynamoTable.tableName
      }
    });**/

    // Function for create products"
    const createProductsFunction = new Function(this, 'createProducts', {
      code: new AssetCode('createProducts'),
      handler: 'createProducts.handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: cdk.Duration.seconds(3),
      memorySize: 512,
      environment : {
        "tableName" : dynamoTable.tableName,
        LOG_LEVEL: 'info'
      },
      logRetention : logs.RetentionDays.ONE_WEEK
    });

    // Function for deleting products"
    const deleteProductsFunction = new Function(this, 'deleteProducts', {
      code: new AssetCode('deleteProducts'),
      handler: 'deleteProducts.handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: cdk.Duration.seconds(3),
      memorySize: 512,
      environment : {
        "tableName" : dynamoTable.tableName,
        LOG_LEVEL: 'info'
      },
      logRetention : logs.RetentionDays.ONE_WEEK
    });


    // Function for deleting products"
    const updateProductsFunction = new Function(this, 'updateProducts', {
          code: new AssetCode('updateProducts'),
          handler: 'updateProducts.handler',
          runtime: Runtime.NODEJS_12_X,
          timeout: cdk.Duration.seconds(3),
          memorySize: 512,
          environment : {
            "tableName" : dynamoTable.tableName,
            LOG_LEVEL: 'info'
          },
          logRetention : logs.RetentionDays.ONE_WEEK
        });


    //assign lambda access to DynamoDB
    //dynamoTable.grantReadData(listProductsFunction);
    dynamoTable.grantReadWriteData(createProductsFunction);
    dynamoTable.grant(deleteProductsFunction, "dynamodb:DeleteItem")
    dynamoTable.grantReadWriteData(updateProductsFunction);
    //Data processing queue.
    const processingQueue = new sqs.Queue(this, 'dataQueue.fifo',{
      visibilityTimeout : cdk.Duration.seconds(30),
      contentBasedDeduplication : true
    });

    //Lambda to read from stream

    const streamFunction = new Function(this, 'streamFunction', {
      code: new AssetCode('streamFunction'),
      handler: 'streamFunction.handler',
      runtime: Runtime.NODEJS_12_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      reservedConcurrentExecutions: 5,
      environment: {
        queueUrl: processingQueue.queueUrl,
        queueName: processingQueue.queueName,
        queuName: processingQueue.queueArn,
        LOG_LEVEL: 'info'
      },
      logRetention : logs.RetentionDays.ONE_WEEK
    });
    dynamoTable.grantStreamRead(streamFunction.grantPrincipal);
    processingQueue.grantSendMessages(streamFunction);

    //Add lambda event source mapping for DynamoDB stream


    const deadLetterQueue = new sqs.Queue(this, 'deadLetterQueue');
    streamFunction.addEventSource(new DynamoEventSource(dynamoTable, {
      startingPosition: StartingPosition.TRIM_HORIZON,
      batchSize: 5,
      
    }));


    // Process Lambda to process from SQS and send to the downstream systems.

    const processFunction = new Function(this, 'processFunction', {
      code: new AssetCode('processFunction'),
      handler: 'processFunction.handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      reservedConcurrentExecutions: 5,
      environment: {
        queueUrl: processingQueue.queueUrl,
        queueName: processingQueue.queueName,
        queuName: processingQueue.queueArn,
        baseUrl: 'https://ev5uwiczj6.execute-api.eu-central-1.amazonaws.com/test',
        LOG_LEVEL: 'info'
      },
      logRetention : logs.RetentionDays.ONE_WEEK,
      events: [
        new SqsEventSource(processingQueue, {
          batchSize :10
        })
      ]
    });




    // GET method for getting all products. It uses Cognito for
    // authorization and the auathorizer defined above.
    /**catalogResource.catalogResource.addMethod('GET', new LambdaIntegration(listProductsFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: catalogResource.apiAuthorizor.ref
      },
      authorizationScopes:["catalog-app/products:GET"]
      
    })**/

    // Post method for adding a product. It uses Cognito for
    // authorization and the auathorizer defined above.
    catalogResource.catalogResource.addMethod('POST', new LambdaIntegration(createProductsFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: catalogResource.apiAuthorizor.ref
      },
      authorizationScopes:["catalog-app/products:CREATE"],
      requestValidator : catalogResource.requestValidator,
      requestModels: {"application/json": catalogResource.createProductModel},
      apiKeyRequired : true
      
      
    })

    // Delete method for deleting a product. It uses Cognito for
    // authorization and the auathorizer defined above.
    catalogResource.catalogIdResource.addMethod('DELETE', new LambdaIntegration(deleteProductsFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: catalogResource.apiAuthorizor.ref
      },
      authorizationScopes:["catalog-app/products:DELTE"],
      apiKeyRequired : true
      
    })
    // Update method for Updating a product. It uses Cognito for
    // authorization and the auathorizer defined above.
    catalogResource.catalogIdResource.addMethod('PUT', new LambdaIntegration(updateProductsFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: catalogResource.apiAuthorizor.ref
      },
      authorizationScopes:["catalog-app/products:UPDATE"],
      requestValidator : catalogResource.requestValidator,
      requestModels: {"application/json": catalogResource.updateProductModel},
      apiKeyRequired: true
      
    })
  }
}
