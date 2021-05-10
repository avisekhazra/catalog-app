import HttpClient from './http-client';
import IProduct from './product.model'
import {  SQSEvent, SQSHandler } from 'aws-lambda';
import QueueService from './queue.service';
import * as winston from "winston";

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

const REGION = "eu-west-1";
const queueService = new QueueService();


export const handler: SQSHandler = async (event: SQSEvent) => {

    const httpClient = new HttpClient(process.env.baseUrl!);
    logger.info(event);
    logger.info(process.env.baseUrl);
    for (const record of event.Records) {
        const {type, data } : {type: string, data: IProduct} = JSON.parse(record.body);
        
        logger.info(`type = ${type}`);
        if(type== 'INSERT' || type == 'MODIFY'){

            let retryCount = 0;
            let failure = true;
            while(retryCount<3 && failure){
                try{
                    const result = await httpClient.createOrUpdateProduct(data);
                    failure = false;
                }catch(error){
                    const {
                        config,
                        response: { status }
                      } = error;
                      logger.info(status);
                      logger.info(error);
                      if(status == 404) 
                        failure = false;
                    retryCount = retryCount + 1 ;
                }
            }
            if(failure)
              throw new Error('processing failed');
            
        } else if(type == 'REMOVE'){
            let retryCount = 0;
            let failure = true;
            while(retryCount<3 && failure){
                try{
                    const result = await httpClient.deleteProduct(data.id);
                    failure = false;
                }catch(error){
                    const {
                        config,
                        response: { status }
                      } = error;
                      logger.info(status);
                      logger.info(error);
                      //skipping retry for 404 cases
                      if(status == 404) 
                        failure = false;
                    retryCount = retryCount + 1 ;
                }
            }
            if(failure)
              throw new Error('processing failed');
        }

    }

    return;
}
