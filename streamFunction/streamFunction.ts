
import { Context, DynamoDBStreamEvent, DynamoDBStreamHandler,StreamRecord } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import SqsService from './queue.service'

const REGION = "eu-west-1";

const sqsService = new SqsService();
export const handler: DynamoDBStreamHandler = async(
    event: DynamoDBStreamEvent,
    context: Context
  ) => {
    console.log(event);
    for (const record of event.Records) {
        if(record.eventName == 'INSERT'|| record.eventName == 'MODIFY'){
            console.log(record.dynamodb?.NewImage);
            let messageBodyJson = {
                type: record.eventName,
                data: AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage||{})
            }
            let message = {
                MessageBody: JSON.stringify(messageBodyJson),
                MessageGroupId : 'products',
                QueueUrl : process.env.queueUrl!
            }
            const result = await sqsService.sendMessage(message);
        }else if(record.eventName == 'REMOVE'){
            console.log(record.dynamodb?.OldImage);
            let messageBodyJson = {
                type: record.eventName,
                data: AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.OldImage||{})
            }
            let message = {
                MessageBody: JSON.stringify(messageBodyJson),
                MessageGroupId : 'products',
                QueueUrl : process.env.queueUrl!
            }
            const result = await sqsService.sendMessage(message);

        }
    }
}