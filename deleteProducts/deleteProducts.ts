import { 
  APIGatewayProxyEvent, 
  APIGatewayProxyResult ,
  APIGatewayEvent,
  APIGatewayProxyHandler
} from "aws-lambda";
import DatabaseService from './database.service';
import ResponseModel from "./response.error.model"

const dataBaseService = new DatabaseService();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent ) : Promise <APIGatewayProxyResult> => {
    console.log(event.pathParameters?.id);
    console.log(event);
    const productId = event.pathParameters?.id;
    const deleteItem = {
      TableName: process.env.tableName!,
      Key:{
          "id": productId
      },
      ConditionExpression : "attribute_exists(id)" 
  };
  try{
    console.log(deleteItem);
    const result = await dataBaseService.delete(deleteItem);

    return {statusCode: 204, body: '' };
  }catch(error){
    console.log(error);
    if(error instanceof ResponseModel){
        return error.generate();
    }
    return new ResponseModel("SERVER_ERROR","Internal Server Error",500).generate();
  };

  };