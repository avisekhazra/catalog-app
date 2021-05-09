import { UserPool, CfnUserPoolResourceServer, OAuthScope } from '@aws-cdk/aws-cognito'
import * as cdk from '@aws-cdk/core';

export class CognitoUserPool extends cdk.Construct {
    public cognitoUserPoolId: string;
    public cognitoUserPoolName: string;
    public cognitoUserPoolArn: string;
    public cognitoUserPoolClientId: string;
    public cognitoIdentityPoolId: string;
    public userPool:UserPool;

    constructor(scope: cdk.Construct, id: string) {
      super(scope, id);

      // Cognito User Pool .
        let userPool = new UserPool(this, 'catalog-userpool', {
            userPoolName: "catalog-userpool",
        })
        this.cognitoUserPoolId = userPool.userPoolId;
        this.cognitoUserPoolArn = userPool.userPoolArn;
        this.cognitoUserPoolName= "catalog-userpool";
        this.userPool=userPool;
    
        //USer pool resource server
        let resourceServer = new CfnUserPoolResourceServer(this, "dev-userpool-resource-server", {
            identifier: "catalog-app",
            name: "catalog-app-resource-server",
            userPoolId: userPool.userPoolId,
            scopes: [
            {
                scopeDescription: "list products",
                scopeName: "products:GET",
            },
            {
                scopeDescription: "create product",
                scopeName: "products:CREATE",
            },
            {
                scopeDescription: "delete product",
                scopeName: "products:DELTE",
            },
            {
                scopeDescription: "update product",
                scopeName: "products:UPDATE",
            },
            ],
        });
    
        //Cognito user pool client
        let client = userPool.addClient("sample-client", {
            generateSecret: true,
            oAuth: {
                flows: {
                    clientCredentials: true,
                },
                scopes: [OAuthScope.custom("catalog-app/products:GET")],
            },
        });
        client.node.addDependency(resourceServer);
        this.cognitoUserPoolClientId = client.userPoolClientId;
    
        //Cognito user pool domain
        userPool.addDomain("catalog-userpool-domain", {
            cognitoDomain: {
            domainPrefix: "catalogapp-userpool",
            },
        });
    
        }
}