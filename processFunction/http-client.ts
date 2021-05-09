import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig  } from 'axios';
import IProduct from './product.model';

const defaultTimeout = 3000;
export default class HttpClient {
    public readonly instance: AxiosInstance;
    
  
    public constructor(baseURL: string) {
      this.instance = axios.create({
        baseURL,
        timeout: defaultTimeout
      });
  
      this._initializeResponseInterceptor();
      this._initializeRequestInterceptor();
    }
  
    private _initializeResponseInterceptor = () => {
      this.instance.interceptors.response.use(
        this._handleResponse,
        this._handleError,
      );
    };

    private _initializeRequestInterceptor = () => {
        this.instance.interceptors.request.use(
          this._handleRequest,
          this._handleError,
        );
      };
  

    private _handleRequest = (config: AxiosRequestConfig) => {
        if (config.method == 'post'){
            config.headers['Content-Type'] = 'application/json';
        }
        console.log(config.headers);
    
        return config;
      };

    private _handleResponse = ({ data }: AxiosResponse) => data;
  
    private _handleError = (error: any) => Promise.reject(error);

    public createOrUpdateProduct = (body: IProduct) => this.instance.post('/supply-chain', body);

    public deleteProduct = (id: string) => this.instance.delete(`/supply-chain/${id}`);
    
  }