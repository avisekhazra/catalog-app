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

  console.log(product);
  const params  = {
      TableName: table!,
      Item: {
          id: product.getId(),
          name: product.getName() ,
          price: product.getPrice(),
          quantity: product.getQuantity(),
      },
      ReturnValues: "ALL_OLD"
  }
  try{
    console.log(params);
    const result = await dataBaseService.create(params);
    let response_headers: ResponseHeader={
      location: `/products/${product.getId()}`
    }
    const {Attributes: data} = result;
      const dataResponse = {
          "data" : data
      }
  
    return {statusCode: 201, body: JSON.stringify(dataResponse), headers: response_headers };
  }catch(error){
      console.log(error);
      let errorResponse = new ResponseModel("SERVER_ERROR","Internal Server Error",500);
      return errorResponse.generate();
  };
 
  
  return {statusCode: 201, body: '' };
  };