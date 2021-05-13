import * as AWS from 'aws-sdk';
import ResponseErrorModel from './response.error.model';

type PutItem = AWS.DynamoDB.DocumentClient.PutItemInput;
type PutItemOutput = AWS.DynamoDB.DocumentClient.PutItemOutput;

AWS.config.update({ region: "eu-west-1" });

const documentClient = new AWS.DynamoDB.DocumentClient();
export default class DatabaseService {

    create = async(params: PutItem): Promise<PutItemOutput> => {
        try {
            return await documentClient.put(params).promise();
        } catch (error) {
            console.log(error);
            const {code: errorCode} = error;
            console.log(`error code = ${errorCode}`);
            if (errorCode === 'ConditionalCheckFailedException'){
                throw new ResponseErrorModel("ITEM_EXISTS","Requested Product already exists.",409);
                
            }
            throw new ResponseErrorModel("SERVER_ERROR", "Internal Server Erorr",500 );
        }
    }
}