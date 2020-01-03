import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Dropdown } from 'semantic-ui-react';
import { isOnBottomHalfOfScreen } from '../util/index';

function renderItem(item) {
  const content = (
    <div>
      <div>{item.text}</div>
      <div style={{ color: 'gray', paddingTop: '5px' }}>{item.description}</div>
    </div>
  );
  return {
    key: item.key,
    text: item.text,
    value: item.value,
    content,
  };
}

class DialInputField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: props.typedNumber,
      results: [],
    }; 
    this.node = null;
  }

  onSearchChange(ev, data) {
    this.setState({
      searchQuery: data.searchQuery,
    });
    this.props.onNumberChangedHandler(this.props.source, ev, data);
  }

  onChange(ev, data) {
    this.setState({
      searchQuery: data.value,
    });
    this.props.onResultSelectHandler(this.props.source, ev, data);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.typedNumber !== this.props.typedNumber) {
      const usePrevResults = this.props.typedNumber.length >= 3 &&
        nextProps.typedNumber.startsWith(this.props.typedNumber);
      this.setState({
        results: this.populateResults(nextProps, usePrevResults),
      });
    }
  }

  populateResults(props, usePrevResults) {
    const { typedNumber, phoneLines, groupedCalls } = props;
    const re = new RegExp('^[\\d\\+\\(\\)]+$');
    let results = [];
    if (typedNumber.length >= 3) {
      if (re.test(typedNumber)) {
        results.push({
          key: 'Typed Number',
          value: typedNumber,
          text: typedNumber,
          description: 'Typed Number',
        });
        const includedNumbers = new Set(results.map(item => item.number));
        results = results.concat(groupedCalls.filter(
          item => item.number.includes(typedNumber) &&
            !includedNumbers.has(item.number))
          .map(item => ({
            key: item.number,
            value: item.number,
            description: 'Recent Calls',
            text: item.number,
          })));
      } else if (usePrevResults) {
        const prev = this.state.results;
        results = prev.filter(item => containsIgnoreCase(item.text, typedNumber));
      } else {
        results = phoneLines
          .filter(item => item.number !== 'N/A' && containsIgnoreCase(item.label, typedNumber.toUpperCase()))
          .map(item => ({
            key: item.label,
            value: item.number,
            text: item.label,
            description: item.number,
          }));
      }
    }
    return results;
  }

  shouldOpenUpward() {
    if (this.props.source === 'POPUP') {
      return false;
    }
    const element = this.node && this.node.ref;
    return isOnBottomHalfOfScreen(element);
  }

  render() {
    const results = this.state.results.map(renderItem);

    return (
      <Dropdown
        ref={(el) => { this.node = el; }}
        searchInput={{ name: this.props.inputName }}
        placeholder="Phone number or name"
        options={results}
        search
        selection
        disabled={this.props.inputDisabled}
        value={this.props.typedNumber}
        onSearchChange={(ev, data) => this.onSearchChange(ev, data)}
        onChange={(ev, data) => this.onChange(ev, data)}
        closeOnChange
        searchQuery={this.state.searchQuery}
        upward={this.shouldOpenUpward()}
        minCharacters={3}
        selectOnNavigation={false}
        style={{ minHeight: 'unset', ...this.props.style }}
        icon={null}
      />
    );
  }
}

function containsIgnoreCase(str, search) {
  return str.toUpperCase().includes(search.toUpperCase());
}

export default DialInputField;
