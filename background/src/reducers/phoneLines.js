import PhoneLinesActions from '../../../shared/action_types/phoneLines';

const initialState = {
  data: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case PhoneLinesActions.STAFF_EXTENSIONS_LOADED: {
      if (action.data === undefined || action.data.length === 0) {
        return state;
      }
      const phoneLines = state.data;
      let newPhoneLines = [];
      newPhoneLines = newPhoneLines.concat(phoneLines);
      newPhoneLines = newPhoneLines.concat(action.data);
      return { ...state, data: newPhoneLines };
    }
    default:
      return state;
  }
};

