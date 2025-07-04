import { db } from '../../db/knex.js';


export default class DecisionEngine {

    async buyPlastic() {

        return true;
    }

    async buyAliminium() {

        return true;
    }

    async buyMachine() {

        return true;
    }

    async repayLoan() {

        return true;
    }    

    async run() {
        if(await this.buyPlastic()){
            console.log('Plastic stock low! Need to buy')
        }else {
            console.log('Plastic stock good!')
        }

        if(await this.buyAliminium()){
            console.log('Aliminium stock low! Need to buy')
        }else {
            console.log('Aliminium stock good!')
        }

        if(await this.buyMachine()){
            console.log('Can buy machine')
        }else {
            console.log('Do not buy machine')
        }

        if(await this.repayLoan()){
            console.log('Need to repay loan')
        }else {
            console.log('No need to repay loan')
        }
    }

} 