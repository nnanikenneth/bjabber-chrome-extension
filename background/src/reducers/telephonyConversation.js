
import { omit } from 'lodash' //maybe I may try to use this to work

const initialState = {
    conversationList : {
        
    },
    calledNumbers: [],  
};
//// use this structure [id: number] or [number1, number2]

export default (state = initialState, action) => {
    switch (action.type) {
        case "CREATE_CONVERSATION":
            return {
                ...state,    
                conversationList : action.conversationList,
            };  
        case "UPDATE_CONVERSATION":
        console.log("updating conversation here: ", action.id);
            return {
                ...state,
                conversationList: {
                    ...state.conversationList,
                    [action.id]: {
                        ...state.conversationList[action.id],
                        capabilities: action.capabilities            
                    }
                }
            };  
        case "DELETE_CONVERSATION":
            const conversationList = action.conversationList;
            return { 
                ...state,
                conversationList :  conversationList,
            }
        default:
            return state;
    }
};
