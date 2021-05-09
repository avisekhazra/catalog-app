import HttpClient from './http-client';
import IProduct from './product.model'
import {  SQSEvent } from 'aws-lambda';
import QueueService from './queue.service';

const REGION = "eu-west-1";
const queueService = new QueueService();

exports.handler = async (event: SQSEvent) => {

    const httpClient = new HttpClient(process.env.baseUrl!);
    console.log(event);
    for (const record of event.Records) {
        const {type, data } : {type: string, data: IProduct} = JSON.parse(record.body);
        
        console.log(`type = ${type}`);
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
                    console.log(status);
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
                    console.log(status);
                    retryCount = retryCount + 1 ;
                }
            }
            if(failure)
              throw new Error('processing failed');
        }

    }

    return;
}
