import * as AWS from 'aws-sdk';
import ResponseErrorModel from './response.error.model';

type DeleteItem = AWS.DynamoDB.DocumentClient.DeleteItemInput;
type DeleteOutput = AWS.DynamoDB.DocumentClient.DeleteItemOutput;

AWS.config.update({ region: "eu-west-1" });

const documentClient = new AWS.DynamoDB.DocumentClient();
export default class DatabaseService {

    delete = async(params: DeleteItem): Promise<DeleteOutput> => {
        try {
             return await documentClient.delete(params).promise();
        } catch (error) {
            console.log(error);
            const {code: errorCode} = error;
            console.log(`error code = ${errorCode}`);
            if (errorCode === 'ConditionalCheckFailedException'){
                throw new ResponseErrorModel("NOT_FOUND","Requested Product not found.",404);
                
            }
            throw new ResponseErrorModel("SERVER_ERROR", "Internal Server Erorr",500 );
        }
    }

    
}