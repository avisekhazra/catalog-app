import { throws } from "assert";

 interface IData {
    data: IProduct;
  }
   interface IProduct {
    id?: string;
    name: string;
    price: number;
    quantity: number;
  }

  export default class Product{
      private id?: string;
      private name: string;
      private price: number;
      private quantity: number;

    
      constructor(data: IData){
          this.id = data.data.id|| '';
          this.name = data.data.name;
          this.price = data.data.price;
          this.quantity = data.data.quantity;
      }

      getId(): string{
          return this.id||'';
      }
      getName(): string{
        return this.name;
      }
      getPrice(): number{
        return this.price;
      }
      getQuantity(): number{
        return this.quantity;
      }

      getProduct():IProduct{
          return {
              id: this.id,
              name: this.name,
              price: this.price,
              quantity: this.quantity
          }
      }
  }
  