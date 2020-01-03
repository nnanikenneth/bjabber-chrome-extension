import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { STORAGE_STATUS } from '../../../../shared/status_types/storage';
import { STORAGE_ACTIONS } from '../../../../shared/action_types/storage';
import Context from '../../util/context';

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["migrateData", "render"] }] */
class Storage extends Component {
  componentDidMount() {
    this.load();
  }

  componentDidUpdate() {
    // Save settings
    if (this.props.savingData !== null &&
        this.props.status === STORAGE_STATUS.SAVING) {
      this.save(this.props.savingData);
    } else if (this.props.status === STORAGE_STATUS.START) {
      this.load();
    }
    if (this.props.data && this.props.data.staff_id) {
      Context.addData({ staff_id: this.props.data.staff_id });
    }
  }

  load() {
    const keysToLoad = ['email', 'staff_id'];

    chrome.storage.sync.get(keysToLoad, (items) => {
      const data = {};

      for (const key of keysToLoad) {
        if (Object.prototype.hasOwnProperty.call(items, key)) {
          data[key] = items[key];
        }
      }
      this.props.dispatch({
        type: STORAGE_ACTIONS.LOADED,
        data,
      });
    });
  }

  save(data) {
    chrome.storage.sync.set(data, () => {
      const newData = Object.assign(this.props.data || {}, data);

      this.props.dispatch({
        type: STORAGE_ACTIONS.SAVED,
        data: newData,
      });
    });
  }

  render() {
    return (<div />);
  }
}

/* eslint react/forbid-prop-types:0 */
Storage.propTypes = {
  status: PropTypes.string,
  data: PropTypes.object,
  savingData: PropTypes.object,
  dispatch: PropTypes.func,
};

const mapStateToProps = state => ({
  status: (state.storage) ? (state.storage.status) : null,
  data: (state.storage) ? (state.storage.data) : {},
  savingData: (state.storage) ? state.storage.savingData : {},
});

export default connect(mapStateToProps)(Storage);
