
type ResponseHeader = { [header: string]: string | number | boolean; }
interface IErrorResponseBody {
    code: string;
    title: string;
    source?: string;
}

interface IResponse {
    statusCode: number;
    headers: ResponseHeader;
    body: string;
}


const RESPONSE_HEADERS: ResponseHeader = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Credentials': true, 
};

export default class ResponseModel {
    private body: IErrorResponseBody;
    private statusCode: number;

    /**
     * ResponseModel Constructor
     * @param code
     * @param title
     * @param statusCode
     */
    constructor( code: string, title: string,  statusCode: number) {
        this.body = {
            code: code,
            title: title,
            
        };
        this.statusCode = statusCode;
    }

    /**
     * Geneate a response
     * @return {IResponse}
     */
     generate = (): IResponse => {
        return {
            statusCode: this.statusCode,
            headers: RESPONSE_HEADERS,
            body: JSON.stringify(this.body),
        };
    }
}