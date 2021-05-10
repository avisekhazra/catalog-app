import {SQS} from 'aws-sdk';

const REGION = "eu-west-1";
const sqs = new SQS({
    region : REGION
})


export default class QueueService {

    deleteMessage = async(message: SQS.DeleteMessageRequest) : Promise<any> =>{
        try {
            return await sqs.deleteMessage(message).promise();
        } catch (error) {
            console.log(error);
           
        }
    }

    
}