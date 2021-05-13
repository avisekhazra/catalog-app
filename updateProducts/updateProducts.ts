import { 
    APIGatewayProxyEvent, 
    APIGatewayProxyResult ,
    APIGatewayEvent,
    APIGatewayProxyHandler
  } from "aws-lambda";
  import DatabaseService from './database.service';
  import Product from "./product.model"
  import ResponseModel from "./response.error.model"
  
  const dataBaseService = new DatabaseService();
  type ResponseHeader = { [header: string]: string | number | boolean; }
  
  export const handler: APIGatewayProxyHandler  = async (event: APIGatewayProxyEvent) : Promise <APIGatewayProxyResult> => {
    console.log(event);
    
    const requestData = JSON.parse(event.body ?? "{}");
    const product = new Product(requestData);
    const table = process.env.tableName;
    const id = event.pathParameters?.id;
    console.log(product);
    const params  = {
        TableName: table!,
        Key: {
            id: id
            
        },
        ConditionExpression : "attribute_exists(id)" ,
        UpdateExpression: "set #productName = :n, price = :p, quantity = :q",
        ExpressionAttributeValues: {
            ":n": product.getName(),
            ":q" : product.getQuantity(),
            ":p" : product.getPrice()
        },
        ExpressionAttributeNames :{
           "#productName" : "name"
        },
        ReturnValues: "UPDATED_NEW"
    }
    try{
      console.log(params);
      const result = await dataBaseService.update(params);
      const {Attributes: data} = result;
      const dataResponse = {
          "data" : data!
      }
      dataResponse.data.id = id;
      
      return {statusCode: 200, body: JSON.stringify(dataResponse)};
    }catch(error){
        console.log(error);
        if(error instanceof ResponseModel){
            return error.generate();
        }
        return new ResponseModel("SERVER_ERROR", "Internal Server Erorr",500 ).generate();
        
    };  
    
    };