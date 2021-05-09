import {  Period, CfnAuthorizer, ResponseType, RequestValidator, RestApi, Resource, Model, JsonSchemaType, UsagePlan, ApiKey, UsagePlanPerApiStage } from '@aws-cdk/aws-apigateway';
import * as cdk from '@aws-cdk/core';
import {CognitoUserPool} from '../cognito-userpool/cognito-userpool'

export class ApiResource extends cdk.Construct {
    public catalogResource:Resource;
    public apiAuthorizor:CfnAuthorizer;
    public catalogIdResource: Resource;
    public createProductModel: Model;
    public updateProductModel: Model;
    public requestValidator: RequestValidator;
    public apiKey: ApiKey;
    
    constructor(scope: cdk.Construct, id: string, cognitoUserPool: CognitoUserPool) {
      super(scope, id);
      // Rest API backed by the helloWorldFunction


      let catalogAppRestApi = new RestApi(this, 'catalogAppRestApi', {
        restApiName: 'catalogApp Service'
      });

      // Authorizer for the Hello World API that uses the
      // Cognito User pool to Authorize users.
      let authorizer = new CfnAuthorizer(this, 'cfnAuth', {
        restApiId: catalogAppRestApi.restApiId,
        name: 'catalog_app_authorizor',
        type: 'COGNITO_USER_POOLS',
        identitySource: 'method.request.header.Authorization',
        providerArns: [cognitoUserPool.cognitoUserPoolArn],
      })
      this.apiAuthorizor = authorizer;
  
      // Hello Resource API for the REST API. 
      let catalog = catalogAppRestApi.root.addResource('catalog');
      this.catalogResource = catalog
      this.catalogIdResource = catalog.addResource("{id}");

      //Request Model for Create product
      const model = new Model(this, "CreateProductModel", {
        modelName: "CreateProductModel",
        restApi: catalogAppRestApi,
        contentType: "application/json",  
        description: "Payload used to validate your requests",
        schema: {
            type: JsonSchemaType.OBJECT,
            properties: {
                data: {
                    type: JsonSchemaType.OBJECT,
                    properties : {
                      id: {
                        type: JsonSchemaType.STRING
                      },
                      price: {
                        type: JsonSchemaType.NUMBER
                      },
                      name: {
                        type: JsonSchemaType.STRING
                      },
                      quantity: {
                        type: JsonSchemaType.INTEGER
                      }
                    },
                    required :[
                      "id",
                      "name",
                      "price",
                      "quantity"
                    ]
                }
              },
            required: [
                "data"              
            ]
        }
    })
    this.createProductModel = model;


    //Request Model for Update product
    const updateModel = new Model(this, "UpdateProductModel", {
      modelName: "UpdateProductModel",
      restApi: catalogAppRestApi,
      contentType: "application/json",  
      description: "Payload used to validate your requests",
      schema: {
          type: JsonSchemaType.OBJECT,
          properties: {
              data: {
                  type: JsonSchemaType.OBJECT,
                  properties : {
                    price: {
                      type: JsonSchemaType.NUMBER
                    },
                    name: {
                      type: JsonSchemaType.STRING
                    },
                    quantity: {
                      type: JsonSchemaType.INTEGER
                    }
                  },
                  required :[
                    "name",
                    "price",
                    "quantity"
                  ]
              }
            },
          required: [
              "data"              
          ]
      }
  })
  this.updateProductModel = updateModel;

// Request body validator
  const requestValidator = new RequestValidator(this, "CatalogAppValidator", {
    restApi: catalogAppRestApi,
    requestValidatorName: "catalog-app-valiadator",
    validateRequestBody: true,
})
this.requestValidator = requestValidator;

//Update Gateway default responses
catalogAppRestApi.addGatewayResponse("catalog-app-bad-request-body", {
  type: ResponseType.BAD_REQUEST_BODY,
  templates :{
    "application/json" :"{ \"code\": \"BAD_REQUEST\", \
    \"title\": \"Invalid request body\" }"
  }
} );


catalogAppRestApi.addGatewayResponse("catalog-app-bad-unauthorized", {
  type: ResponseType.UNAUTHORIZED,
  templates :{
    "application/json" :"{ \"code\": \"UNAUTHORIZED\", \
    \"title\": \"Unauthorized for the request\" }"
  }
} );

catalogAppRestApi.addGatewayResponse("catalog-app-invalid-api-key", {
  type: ResponseType.INVALID_API_KEY,
  templates :{
    "application/json" :"{ \"code\": \"INVALID_API_KEY\", \
    \"title\": \"API Key is invalid\" }"
  }
} );

catalogAppRestApi.addGatewayResponse("catalog-app-throttled", {
  type: ResponseType.THROTTLED,
  templates :{
    "application/json" :"{ \"code\": \"QUOTA_EXCEEDED\", \
    \"title\": \"Request Quota exceeded.\" }"
  }
} );
catalogAppRestApi.addGatewayResponse("catalog-app-timeout", {
  type: ResponseType.INTEGRATION_TIMEOUT,
  templates :{
    "application/json" :"{ \"code\": \"GATEWAY_TIMEOUT\", \
    \"title\": \"Gateway time out.\" }"
  }
} );

catalogAppRestApi.addGatewayResponse("catalog-app-config-error", {
  type: ResponseType.API_CONFIGURATION_ERROR,
  templates :{
    "application/json" :"{ \"code\": \"CONFIGURATION_ERROR\", \
    \"title\": \"API Configuration Error.\" }"
  }
} );

catalogAppRestApi.addGatewayResponse("catalog-app-server-error", {
  type: ResponseType.DEFAULT_5XX,
  templates :{
    "application/json" :"{ \"code\": \"SERVER_ERROR\", \
    \"title\": \"Internal Servere Error.\" }"
  }
} );
catalogAppRestApi.addGatewayResponse("catalog-app-default4xx", {
  type: ResponseType.DEFAULT_4XX,
  templates :{
    "application/json" :"{ \"code\": \"BAD_REQUEST\", \
    \"title\": \"Invalid request.\" }"
  }
} );


//Usage plan and quota
const apiKey = new ApiKey(scope,"catalog-app-prod-key");

new UsagePlan(scope,"catalog-app-prod-usage-plan", {
  apiKey : apiKey,
  apiStages :[
    { 
      stage : catalogAppRestApi.deploymentStage,
      api : catalogAppRestApi
    }
  ],
  quota:{
    limit: 1000,
    period: Period.MONTH
  },
  throttle :{
    rateLimit : 100,
    burstLimit: 10
  }

});
this.apiKey = apiKey;
    }
}
