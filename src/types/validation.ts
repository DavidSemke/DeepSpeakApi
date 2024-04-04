import { 
    ErrorMessage, 
    FieldMessageFactory 
} from "express-validator/src/base";
import { ValidationChain } from "express-validator";


export type Validator = (
    fields?: string | string[] | undefined, 
    message?: FieldMessageFactory | ErrorMessage | undefined
) => ValidationChain