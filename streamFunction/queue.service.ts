import {SQS} from 'aws-sdk';
import ResponseErrorModel from './response.error.model'

const REGION = "eu-west-1";
const sqs = new SQS({
    region : REGION
})

export default class QueueService {

    sendMessage = async(message: SQS.SendMessageRequest) : Promise<SQS.SendMessageResult> =>{
        try {
            return await sqs.sendMessage(message).promise();
        } catch (error) {
            console.log(error);
            throw new ResponseErrorModel("SERVER_ERROR", "Internal Server Erorr",500 );
        }
    }

    receieveMessages = async (request:SQS.ReceiveMessageRequest) : Promise<SQS.ReceiveMessageResult>=> {
        try {
            return await sqs.receiveMessage(request).promise();
        } catch (error) {
            console.log(error);
            throw new ResponseErrorModel("SERVER_ERROR", "Internal Server Erorr",500 );
        }
    }
}