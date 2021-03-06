/**
 * Created by John on 8/22/2016.
 * React components for Trx tracking module
 */

import React from 'react';
import Proptypes from 'prop-types';

import 'whatwg-fetch';
import ES6Promise from 'es6-promise';
ES6Promise.polyfill();

import Stopwatch from 'timer-stopwatch';

import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import TextField from 'material-ui/TextField';
import MenuItem from 'material-ui/MenuItem';
import AutoComplete from 'material-ui/AutoComplete';
import DatePicker from 'material-ui/DatePicker';
import Snackbar from 'material-ui/Snackbar';
import Card from 'material-ui/Card/Card.js';
import CardHeader from 'material-ui/Card/CardHeader.js';
import CardText from 'material-ui/Card/CardText.js';
import List from 'material-ui/List'

import CustomerEntry from 'customer_entry.jsx';

import {getSelCustTrxs, getSelectedCustomer, getSelectedBillable, getTrx, getBillable} from 'util.jsx';
import Paging_nav from 'paging_nav.jsx';
import DeleteDialog from 'deleteDialog.jsx';
import InvoiceReport from 'invoice_report.jsx';

class BillableEntry extends React.Component
{
    constructor(props) {
        super(props);
        this.formfields = {
            billable_entry_id: '',
            billable_entry_custid: '',
            billable_entry_customer: '',
            billable_entry_descr: '',
            billable_entry_type: '',
            billable_entry_unit: '',
            billable_entry_price: ''
        };

        this.state = {
            open: false,
            snackbarOpen: false,
            fields: JSON.parse(JSON.stringify(this.formfields)),
            errors: JSON.parse(JSON.stringify(this.formfields)),
            message: '',
            edit: false
        };
    }

    removeErrors = () => this.setState({errors: JSON.parse(JSON.stringify(this.formfields))});

    handleOpen = (chosen, edit = false) => {
        //find out which customer is selected
        for(var i = 0; i < cur_user.customer.length; i++)
            if(cur_user.customer[i].selected) break;
        const customer = cur_user.customer[i];

        if (edit) { //if editing, chosen is an id, need to pre-fill form with chosen customer's data
            const billbl = getBillable(chosen), tmp = {};
            tmp.customer= customer.company;
            tmp.id = billbl.id;
            tmp.custid = customer.id;
            tmp.descr = billbl.descr;
            tmp.type = billbl.type;
            tmp.unit = billbl.unit;
            tmp.price = billbl.price;
            this.setState({open: true, fields: tmp, edit: edit, snackbarOpen: false});
        } else {    //else if creating, chosen is a string, customer & descr get default value
            let tmp = JSON.parse(JSON.stringify(this.state.fields));
            tmp.custid= customer.id;
            tmp.customer= customer.company;
            tmp.descr = chosen;
            this.setState({open: true, fields: tmp, edit: edit, snackbarOpen: false});
        }
    };

    handleSave = () => {
        this.removeErrors();
        const billable = new FormData();
        const fields = Object.keys(this.formfields);
        for (let i = 3; i < fields.length; i++)  //starting at 1 b/c don't want to include 'customer' field in FormData
            billable.set(fields[i], document.getElementById(fields[i]).value);
        billable.set('billable_entry_id', this.state.fields.id);
        billable.set('billable_entry_custid', this.state.fields.custid);
        fetch('save_billable?edit=' + this.state.edit , {
            method: 'post',
            body: billable,
            headers: {'X-CSRF-Token': _token, 'Accept': 'application/json'},
            credentials: 'same-origin'
        }).then( response => {
            if(response.ok) {   //if save went ok, show Snackbar, update global cur_user & update the cust. drop-down
                response.json().then(
                    json => {
                        for (var i = 0; i < cur_user.customer.length; i++) {
                            if(cur_user.customer[i].selected) {
                                break;
                            }
                        }
                        cur_user = JSON.parse(json.cur_user);
                        cur_user.customer[i].selected = true;
                        this.setState({message: json.message, snackbarOpen: true});
                        this.props.updateBillablesDropDown();
                    }
                );
            } else {    //flash errors into view
                response.json().then( errors => {
                    const keys = Object.keys(errors);
                    const fields = {};
                    for (let i = 0; i < keys.length; i++) {
                        fields[keys[i]] = errors[keys[i]];
                    }
                    this.setState({errors: fields});
                });
            }
        });
    };

    handleClose = () => {
        this.removeErrors();
        this.setState({
            open: false,
            snackbarOpen: false,
            fields: JSON.parse(JSON.stringify(this.formfields))
        });
    };

    render() {
        const title = (this.state.edit) ? "Edit this customer's billable item." : "New billable item. Love it.";
        const style = {width: '115px', marginRight: '30px', display: 'inline-block'};
        const actions = [
            <FlatButton
                label="Save Billable"
                onClick={this.handleSave}
                style={{color: 'green'}}
            />,
            <FlatButton
                label="Cancel"
                onClick={this.handleClose}
                style={{color: 'red'}}
            />
        ];
        return (
            <Dialog
                title={title}
                actions={actions}
                modal={true}
                open={this.state.open}
                bodyStyle={{overflow: 'auto'}}
            >
                <form id="billable_entry">
                    <fieldset>
                        <TextField
                            floatingLabelText="Customer"
                            errorText={this.state.errors.customer}
                            id="billable_entry_customer"
                            style={{marginRight: '30px', display: 'inline-block'}}
                            defaultValue={this.state.fields.customer}
                            disabled={true}
                        />
                        <TextField
                            floatingLabelText="Description"
                            hintText="What are you selling them?"
                            floatingLabelFixed={true}
                            type="text"
                            id="billable_entry_descr"
                            defaultValue={this.state.fields.descr}
                            errorText={this.state.errors.billable_entry_descr}
                            style={{display: 'inline-block'}}
                        />
                        <div style={{display: 'flex'}}>
                            <AutoComplete
                                dataSource= {[{text: 'Service', value: 'service'}, {text: 'Product', value: 'product'}]}
                                floatingLabelText="Type"
                                hintText="product or service"
                                id="billable_entry_type"
                                searchText={this.state.fields.type}
                                filter={(searchText, key) => { return (key.toLowerCase().indexOf(searchText.toLowerCase()) >= 0); }}
                                textFieldStyle={style}
                                listStyle={style}
                                style={style}
                                openOnFocus={true}
                                errorText={this.state.errors.billable_entry_type}
                            />
                            <TextField
                                floatingLabelText="Unit"
                                hintText="hourly, pieces, etc."
                                type="text"
                                errorText={this.state.errors.billable_entry_unit}
                                id="billable_entry_unit"
                                defaultValue={this.state.fields.unit}
                                style={style}
                            />
                            <TextField
                                floatingLabelText="Price"
                                hintText="Price per unit"
                                type="number"
                                min="0"
                                step="any"
                                errorText={this.state.errors.billable_entry_price}
                                id="billable_entry_price"
                                defaultValue={(this.state.fields.price) ? this.state.fields.price : undefined}
                                style={style}
                            />
                        </div>
                    </fieldset>
                    <Snackbar bodyStyle={{textAlign: 'center'}} open={this.state.snackbarOpen} message={this.state.message} onRequestClose={this.handleClose} autoHideDuration={3000} />
                </form>
            </Dialog>
        );
    }
}
BillableEntry.propTypes = {
    updateBillablesDropDown: Proptypes.func.isRequired
};

class DatePickerControlled extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            controlledDate: null,
        };
    }

    handleChange = (event, date) => {
        this.setState({
            controlledDate: date,
        });
    };

    render() {
        return (
            <DatePicker
                value={this.state.controlledDate}
                onChange={this.handleChange}
                autoOk={this.props.autoOk}
                floatingLabelText={this.props.floatingLabelText}
                style={this.props.style}
                textFieldStyle={this.props.textFieldStyle}
                id={this.props.id}
                errorText={this.props.errorText}
            />
        );
    }
}

class Qty extends React.Component
{
    constructor(props) {
        super(props);
        this.state = {
            showTimer: false,
            val: '',
            time: '00:00:00'
        }
        this.stopwatch = new Stopwatch();
        this.stopwatch.refreshRateMS = 999;
        this.stopwatch.onTime(() => {
            this.setState({
                time: this.msToHrsMinsSecs(this.stopwatch.ms),
                val: this.msToDecimal(this.stopwatch.ms),
            });
            this.props.updateTotal();
        })
    }
    time = () => {
        if(this.stopwatch == undefined) return;
        if(this.state.val != '')
            this.stopwatch._elapsedMS = this.timeStrToMs(this.state.val);
        if (this.stopwatch.state) { //pause timer
            this.stopwatch.stop();
        } else {    //start/resume timer
            this.stopwatch.start();
            if(!this.state.showTimer)
                this.setState({showTimer: true});
        }
    }
    turnOffTimer = () => {
        this.setState({
            showTimer: false,
            val: this.msToDecimal(this.stopwatch.ms),
        });
        this.stopwatch.stop();
        this.stopwatch._elapsedMS = 0;
        this.props.updateTotal();
    }
    msToHrsMinsSecs = (ms) => {
        let hrs = parseInt((ms/1000) / 3600);
        let mins = parseInt(((ms/1000) / 60) % 60);
        let secs = parseInt((ms/1000) % 60);
        if(hrs.toString().length < 2) hrs = '0'+ hrs.toString();
        if(mins.toString().length < 2) mins = '0'+ mins.toString();
        if(secs.toString().length < 2) secs = '0'+ secs.toString();
        return hrs+':'+mins+':'+secs;
    }
    msToDecimal = (ms) => {
        let hrs = parseFloat(((ms/1000) / 60) / 60).toFixed(2);
        return hrs;
    }
    timeStrToMs = (timeStr) => {
        let timeString = timeStr,
            seconds = 0;
        if (/^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(timeString) == true)
            return seconds = ((parseInt(timeString.substring(0, 2)) * 60 * 60) + (parseInt(timeString.substring(3, 5)) * 60) + (parseInt(timeString.substring(6, 8)))) * 1000;
        else if (/^[0-9]{2}\.[0-9]{2}$/.test(timeString) == true)
            return seconds = ((parseInt(timeString.substring(0, 2)) * 60 * 60) + ((parseInt(timeString.substring(3, 5)) / 100) * 60 * 60)) * 1000;
        else if (/^[0-9]{1}\.[0-9]{2}$/.test(timeString) == true)
            return seconds = ((parseInt(timeString.substring(0, 1)) * 60 * 60) + ((parseInt(timeString.substring(2, 4)) / 100) * 60 * 60)) * 1000;
        else if (/^[0-9]{1}\.[0-9]{1}$/.test(timeString) == true)
            return seconds = ((parseInt(timeString.substring(0, 1)) * 60 * 60) + ((parseInt(timeString.substring(2)) / 10) * 60 * 60)) * 1000;
        else if (/^[0-9]{1}$/.test(timeString) == true)
            return seconds = ((parseInt(timeString.substring(0, 1)) * 60 * 60)) * 1000;
        else
            return seconds;
    }
    handleChange = (event) => {
        if(this.state.showTimer == true) {
            let time = event.currentTarget.value;
            this.stopwatch._elapsedMS = this.timeStrToMs(time);
            this.stopwatch.ms = this.timeStrToMs(time);
            this.setState({time: time, val: this.msToHrsMinsSecs(this.stopwatch._elapsedMS)});
        } else
            this.setState({val: event.currentTarget.value});
    }
    render() {
        return (
            <span>
                <IconButton
                    iconClassName="material-icons"
                    style={{top: '7px', left: '7px', opacity: '0.5'}}
                    onClick={ () => {this.time(); }}
                    onDoubleClick={ () => {this.turnOffTimer(); }}
                >
                    timer
                </IconButton>
                <TextField
                    floatingLabelText="Qty"
                    floatingLabelFixed={true}
                    id={this.props._id}
                    type="text"
                    min="0"
                    step="any"
                    style={{width: '100px', marginRight: '25px'}}
                    value={(this.state.showTimer) ? this.state.time : this.state.val}
                    name="qty"
                    errorText={this.props.errorText}
                    onChange={this.handleChange}
                />
            </span>
        );
    }
}

class Trx extends React.Component
{
    constructor(props) {
        super(props);
        this.state = {
            customers: this.initCustomers(),
            billables: [],
            trx: [],
            snackbarOpen: false,
            message: '',
            showDelCustDialog: false,
            disableBillables: true,
            errors: {'trx_entry_trxdt': '', 'trx_entry_customer': '', 'trx_entry_qty': '', 'trx_entry_billable': '', 'trx_entry_amt': ''},
            amt: '$ 0.00'
        };
    }
    initCustomers = () => {
        const customers = [];
        for (let i = 0; i < cur_user.customer.length; i++) {
            const customer = {
                text: cur_user.customer[i].company,
                value: (
                    <MenuItem primaryText={cur_user.customer[i].company} innerDivStyle={{display: 'flex', marginBottom: '9px'}} >
                        <span className="cust_icons" >
                            <IconButton
                                data-cust-id={cur_user.customer[i].id.toString()}
                                iconClassName="fa fa-pencil"
                                tooltip="Edit Customer"
                                onClick={this.editCust}
                            />
                            <IconButton
                                data-cust-id={cur_user.customer[i].id.toString()}
                                iconClassName="fa fa-trash-o"
                                tooltip="Delete Customer"
                                onClick={this.showDelCustDialog}
                            />
                        </span>
                    </MenuItem>
                )
            };
            customers.push(customer);
        }
        return customers;
    };

    deleteCustomer = cust_id => {
        this.refs.del_cust_dialog.handleClose();
        fetch(
            'delete_customer/' + cust_id,
            {method: 'DELETE', headers: {'X-CSRF-Token': _token, 'Accept': 'application/json'}, credentials: 'same-origin'}
        ).then((response) => {
                if(response.ok) //Remove deleted customer from drop-down and show snackbar
                    response.json().then((json) => {
                        cur_user = JSON.parse(json.cur_user);
                        this.setState({snackbarOpen: true, message: json.message});
                        this.updateCustomers();
                        this.handleClear();
                    });
            });
    };

    deleteBillable = billable_id => {
        this.refs.del_billables_dialog.handleClose();
        fetch(
            'delete_billable/' + billable_id,
            {method: 'DELETE', headers: {'X-CSRF-Token': _token, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json'}, credentials: 'same-origin'}
        ).then((response) => {
            if(response.ok) //Remove deleted customer from drop-down and show snackbar
                response.json().then((json) => {
                    for(var i = 0; i < cur_user.customer.length; i++)
                        if(cur_user.customer[i].selected) break;
                    cur_user = JSON.parse(json.cur_user);
                    cur_user.customer[i].selected = true;
                    this.setState({snackbarOpen: true, message: json.message});
                    this.updateBillables();
                    this.updateTrx();
                });
            });
    };

    removeErrors = () => this.setState({errors: {'trxdt': '', 'customer': '', 'qty': '', 'billable': '', 'amt': ''}});

    handleSave = () => {
        this.removeErrors();
        const form = new FormData();
        form.append('id', document.getElementById('trx_entry_trxid').value);
        form.append('trxdt', document.getElementById('trx_entry_trxdt').value);
        form.append('customer', document.getElementById('trx_entry_customer').value);
        form.append('qty', document.getElementById('trx_entry_qty').value);
        form.append('billable', document.getElementById('trx_entry_billable').value);
        form.append('descr', document.getElementById('trx_entry_descr').value);
        form.append('amt', this.state.amt);
        let cust = getSelectedCustomer(),
            page = cust.custtrx.current_page,
            sort = cust.custtrx.sort,
            desc = (cust.custtrx.desc) ? '&desc' : '';
        fetch('/save_trx?page='+page+'&sort='+sort+desc, {
            method: 'POST',
            body: form,
            headers: {'X-CSRF-Token': _token, "Accept": "application/json"},
            credentials: 'same-origin'
        }).then((response) => {
            if(response.ok) {
                response.json().then(json => {
                    cur_user = JSON.parse(json.cur_user);
                    for(let i = 0; i < cur_user.customer.length; i++) {
                        if(cur_user.customer[i].id == cust.id) {
                            cur_user.customer[i].custtrx.sort = sort;
                            cur_user.customer[i].custtrx.desc = desc;
                            break;
                        }
                    }
                    this.setState({snackbarOpen: true, message: 'Transaction was saved.'});
                    this.doesCustExist(document.getElementById('trx_entry_customer').value); //so billables & trx are updated
                })
            } else {
                response.json()
                .then((json) => {
                    this.setState({
                        errors: {
                            trxdt: json.trxdt,
                            customer: json.customer,
                            qty: json.qty,
                            billable: json.billable,
                            descr: json.descr,
                            amt: json.amt,
                        }
                    });
                });
            }
        }).catch(function (errors) {
            console.log(errors);
        });
    };

    handleEdit = event => {
        //grab selected customer, the trx and it's billable
        let cust = getSelectedCustomer();
        let trx = getTrx(event.currentTarget.id);
        let billable = getBillable(trx.item);
        // Populate form with selected trx
        document.getElementById('trx_entry_trxid').value = trx.id;
        this.refs.trx_entry_trxdt.setState({date: new Date(new Date(trx.trxdt).getUTCFullYear(), new Date(trx.trxdt).getUTCMonth(), new Date(trx.trxdt).getUTCDate())});
        this.refs.trx_entry_customer.setState({searchText: cust.company});
        this.refs.trx_entry_qty.setState({val: (trx.amt / billable.price).toFixed(2)});
        this.refs.trx_entry_billable.setState({searchText: billable.descr});
        if(trx.descr) {
            this.refs.trx_entry_descr.setState({hasValue: true});
            document.getElementById('trx_entry_descr').value = trx.descr;
        }
        this.setState({amt: '$ ' + trx.amt});
        // Hitting the save button will call this.handleSave()
    };

    handleDelete = event => {
        let cust = getSelectedCustomer(),
            sort = cust.custtrx.sort,
            desc = (cust.custtrx.desc) ? '&desc' : '',
            page = cust.custtrx.current_page;
        fetch(
            'del_trx/' + event.currentTarget.id+'?page='+page+'&sort='+sort+desc,
            {
                method: 'DELETE',
                headers: {'X-CSRF-Token': _token, 'X-Requested-With': 'XMLHttpRequest'},
                credentials: 'same-origin',
            }
        ).then((response) => {
            if(response.ok)
                response.json().then((json) => {
                    cur_user = JSON.parse(json.cur_user);
                    for(let i = 0; i < cur_user.customer.length; i++) {
                        if(cur_user.customer[i].id == cust.id) {
                            cur_user.customer[i].custtrx.sort = sort;
                            cur_user.customer[i].custtrx.desc = desc;
                            break;
                        }
                    }
                    document.getElementById('trx_entry_trxid').value = null;
                    this.setState({snackbarOpen: true, message: 'Transaction was deleted.'});
                    this.doesCustExist(document.getElementById('trx_entry_customer').value);
                });
        });
    };

    handleClose = () => {
        this.removeErrors();
        this.setState({snackbarOpen: false});
    };

    handleClear = () => {
        this.removeErrors();
        document.getElementById('trx_entry_trxid').value = '';
        this.refs.trx_entry_trxdt.setState({controlledDate: {}});
        if(this.refs.trx_entry_customer.state.searchText != '') this.refs.trx_entry_customer.setState({searchText: ''});
        this.refs.trx_entry_qty.setState({val: '', time: '', showTimer: false});
        if(this.refs.trx_entry_billable.state.searchText != '') this.refs.trx_entry_billable.setState({searchText: ''});
        this.refs.trx_entry_descr.setState({hasValue: false});
        document.getElementById('trx_entry_descr').value = '';
        let selCustId = getSelectedCustomer().id;
        if(selCustId) {
            for(var i = 0; i < cur_user.customer.length; i++)
                if(cur_user.customer[i].id == selCustId)
                    cur_user.customer[i].selected = false;
        }
        this.setState({amt: '$ 0.00', trx: []})

    };

    showDelCustDialog = event => this.refs.del_cust_dialog.handleOpen(event.currentTarget.dataset.custId);

    showDelBillableDialog = event => this.refs.del_billables_dialog.handleOpen(event.currentTarget.getAttribute('class'));

    editCust = event => {
        const
            custId = event.currentTarget.dataset.custId,
            customer = cur_user.customer.find( customer => customer.id === Number(custId));
        this.doesCustExist(customer.company);
        this.refs.cust_entry.handleOpen(custId, true);
    };

    editBillable = event => this.refs.billables_entry.handleOpen(event.currentTarget.getAttribute('class'), true);

    /**
     * Auto-complete selection/onBlur calls this function with cust object when selecting from drop-down
     * @param chosen - Object|String - can be a FocusEvent or MenuItem object, or a string, on blur or select
     * @return boolean true if customer exists
     * @return boolean false if customer doesn't exist & opens CustomerEntry dialog
     */
    doesCustExist = chosen => {
        let exists = false;
        let input = '';
        this.setState({disableBillables: true});

        // Get input customer
        if (typeof chosen == 'string') { // pressing enter in customer
            if (chosen == '') return false;
            input = chosen;
        } else if(chosen.value) {
            input = chosen.text;
        } else if (chosen instanceof FocusEvent) { // onBlur of customer/billables field (during select & tab or click out)
            if (chosen.target.value.length == 0 || !chosen.relatedTarget) return false;
            if (chosen.relatedTarget.nodeName == 'SPAN') //selecting from customer drop-down - onBLur makes 1st call
                return true;
            input = chosen.target.value;
        }

        // check if customer exists and get their billables for drop-down store, else open CustomerEntry/BillableEntry dialog
        for (let i = 0; i < cur_user.customer.length; i++) {
            cur_user.customer[i].selected = false;
            if (cur_user.customer[i].company.toLowerCase().trim() == input.toLowerCase().trim()) {
                cur_user.customer[i].selected = true;
                var page = cur_user.customer[i].custtrx.current_page;
                exists = true;
                break;
            }
        }
        if (exists) {
            this.setState({disableBillables: false});
            this.updateBillables();
            this.updateTrx(page);
            return true;
        } else {
            this.refs.cust_entry.handleOpen(input);
            return false;
        }
    };

    doesBillableExist = chosen => {
        let exists = false;
        let input = '';

        // Get input billable
        if (typeof chosen == 'string') { // pressing enter in billables
            if (chosen == '') return false;
            input = chosen;
        } else if(chosen.value) //selecting from billables drop-down - onNewRequest makes 2nd call
            input = chosen.text;
        else if (chosen instanceof FocusEvent) { // onBlur of billables field (during select & tab & or click out)
            if (chosen.target.value.length == 0 || !chosen.relatedTarget) return false;
            if (chosen.relatedTarget.nodeName == 'SPAN') //selecting from billables drop-down - onBLur makes 1st call
                return true;
            input = chosen.target.value;
        }

        // check if customer exists and get their billables for drop-down store, else open CustomerEntry/BillableEntry dialog
        const cust = getSelectedCustomer();
        if( ! cust.billable)
            exists = false;
        else
            for (let j = 0; j < cust.billable.length; j++) {
                cust.billable[j].selected = false;
                if (cust.billable[j] && cust.billable[j].descr.toLowerCase().trim() == input.toLowerCase().trim()) {
                    exists = true;
                    cust.billable[j].selected = true;
                }
            }
        if (exists) {
            this.updateTotal();
            return true;
        } else {
            this.refs.billables_entry.handleOpen(input);
            return false;
        }
    };

    updateCustomers = () => this.setState({customers: this.initCustomers()});

    updateBillables = () => {
        let billables, cust = getSelectedCustomer();
        if(!cust.billable)
            return;
        billables = cust.billable.map((billable) => {
            return {
                text: billable.descr,
                value: (
                    <MenuItem primaryText={billable.descr} innerDivStyle={{display: 'flex', marginBottom: '9px'}} >
                        <span className="cust_icons" >
                            <IconButton
                                className={billable.id.toString()}
                                iconClassName="fa fa-pencil"
                                tooltip="Edit Billable"
                                onClick={this.editBillable}
                            />
                            <IconButton
                                className={billable.id.toString()}
                                iconClassName="fa fa-trash-o"
                                tooltip="Delete Billable"
                                onClick={this.showDelBillableDialog}
                            />
                        </span>
                    </MenuItem>
                )
            };
        });
        this.setState({billables: billables});
    };

    updateTotal = () => {
        let qty = document.getElementById('trx_entry_qty').value,
            billable = getSelectedBillable();
        if (qty == "" || billable == false) return;
        if (/^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(qty))
            qty = (this.refs.trx_entry_qty.stopwatch.ms / 1000) / 60 / 60;
        else
            qty = parseFloat(qty).toFixed(2);
        let price = parseFloat(billable.price);
        if(price && price != NaN && qty && qty != NaN)
            this.setState({amt: '$ ' + (qty * price).toFixed(2)});
    };

    updateTrx = (page = 1) => {
        let cust = getSelectedCustomer(),
            sort = (cust.custtrx.sort) ? cust.custtrx.sort : 'trxdt',
            desc = cust.custtrx.desc;
        getSelCustTrxs(page, sort, desc);
        if (cust.custtrx.data) {
            //Assemble trx rows
            let trx = [ <Paging_nav key="paging_nav" refresh={this.updateTrx} page={cust.custtrx}/> ];
            trx.push(
                <tr key="trx_th">
                    <th>Edit / Delete</th>
                    <th id="trxdt" data-sort="desc" onClick={this.sort}>Trx Date</th>
                    <th id="status" data-sort="" onClick={this.sort}>Status</th>
                    <th id="item" data-sort="" onClick={this.sort}>Billable</th>
                    <th id="descr" data-sort="" onClick={this.sort}>Description</th>
                    <th>Quantity</th>
                    <th id="amt" data-sort="" onClick={this.sort}>Amount</th>
                </tr>
            );
            for(let j = 0; j < cust.custtrx.data.length; j++) {
                //get each transaction's billable's descr and qty
                let billable = getBillable(cust.custtrx.data[j].item),
                    qty = (cust.custtrx.data[j].amt / billable.price).toFixed(2) + ' x $' + billable.price +'/'+billable.unit,
                    actions = (cust.custtrx.data[j].status == 'Open') ?
                        (<span className="trx_icons" >
                                <IconButton
                                    iconClassName="fa fa-pencil"
                                    onClick={this.handleEdit}
                                    style={style}
                                    id={cust.custtrx.data[j].id}
                                />
                                <IconButton
                                    iconClassName="fa fa-trash-o"
                                    onClick={this.handleDelete}
                                    style={style}
                                    id={cust.custtrx.data[j].id}
                                />
                    </span>)
                        :
                        <FlatButton
                            label="View Invoice"
                            labelStyle={{fontSize: 'small'}}
                            onClick={() => this.refs.inv_rpt.handleOpen(cust.custtrx.data[j].inv)}
                        />,
                    //render table row
                    style = {
                        width: '10px',
                        height: '10px',
                        margin: '2px'
                    },
                    tmp =
                        <tr key={'trx_id_' + cust.custtrx.data[j].id}>
                            <td>{actions}</td>
                            <td>{cust.custtrx.data[j].trxdt}</td>
                            <td>{cust.custtrx.data[j].status}</td>
                            <td>{billable.descr}</td>
                            <td>{cust.custtrx.data[j].descr}</td>
                            <td>{qty}</td>
                            <td>$ {cust.custtrx.data[j].amt}</td>
                        </tr>;
                trx.push(tmp);
            }
            this.setState({trx: trx});
        }
    };

    /**
     * will set sort and dir in cur_user global
     * @param event onClick of trx table header
     */
    sort = (event) => {
        let field = event.currentTarget.id,
            dir = event.currentTarget.getAttribute('data-sort');
        //if asc, set to desc
        if(dir == 'asc') {
            event.currentTarget.setAttribute('data-sort', 'desc');
            dir = 'desc';
        }
        else if(dir === '' || dir === 'desc') {
            event.currentTarget.setAttribute('data-sort', 'asc');
            dir = 'asc';
        }
        //update transactions
        if(dir === 'asc')
            dir = false;
        else if(dir === 'desc')
            dir = true;
        let cust = getSelectedCustomer();
        cust.custtrx.sort = field;
        cust.custtrx.desc = dir;
        for(let i = 0; i < cur_user.customer.length; i++)
            if(cur_user.customer[i].id == cust.id) {
                cur_user.customer[i] = cust;
                break;
            }
        this.updateTrx(1);
    };

    // AutoComplete components aren't emitting onBlur (see mui issue), therefore setting listener after render, old school
    // https://github.com/callemall/material-ui/issues/2294 says onBlur is fixed, but it's not
    componentDidMount = () => {
        document.getElementById('trx_entry_customer').addEventListener('blur', this.doesCustExist);
        document.getElementById('trx_entry_billable').addEventListener('blur', this.doesBillableExist);
        document.getElementById('trx_entry_qty').addEventListener('blur', this.updateTotal);
    };

    render() {
        return (
            <Card className="cards">
                <CardHeader
                    title="Transactions"
                    subtitle="Track Time & Expenses"
                    actAsExpander={false}
                    avatar="https://res.cloudinary.com/realjv3/image/upload/v1516748943/clock-1_nwisn9.png"
                />
                <CardText expandable={false} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    flexWrap: 'nowrap'
                }}>
                    <section>
                        <CustomerEntry ref="cust_entry" updateCustomersDropDown={this.updateCustomers} />
                        <BillableEntry ref="billables_entry" updateBillablesDropDown={this.updateBillables} />
                        <DeleteDialog ref="del_cust_dialog" text="Do you really want to permanently delete this customer and all of their transactions?" handleDelete={this.deleteCustomer} />
                        <DeleteDialog ref="del_billables_dialog" text="Do you really want to permanently delete this billable item and all of the related transactions?" handleDelete={this.deleteBillable} />
                        <InvoiceReport ref="inv_rpt"/>
                        <form id="trx_form" className="trx_form" ref="trx_form" >
                            <input type="hidden" id="trx_entry_trxid" />
                            <DatePickerControlled
                                autoOk={true}
                                floatingLabelText="Date"
                                style={{marginRight: '25px'}}
                                textFieldStyle={{width:'90px'}}
                                id="trx_entry_trxdt"
                                ref="trx_entry_trxdt"
                                errorText={this.state.errors.trxdt}
                            />
                            <AutoComplete
                                dataSource={this.state.customers}
                                openOnFocus={true}
                                floatingLabelText="Customer"
                                id="trx_entry_customer"
                                ref="trx_entry_customer"
                                style={{marginRight: '25px', width: '195px'}}
                                textFieldStyle={{width: '195px'}}
                                filter={(searchText, key) => { return (key.toLowerCase().indexOf(searchText.toLowerCase()) >= 0); }}
                                listStyle={{width: 'auto', minWidth: '400px'}}
                                onNewRequest={this.doesCustExist}
                                errorText={this.state.errors.customer}
                            />
                            <Qty _id="trx_entry_qty" ref="trx_entry_qty" errorText={this.state.errors.qty} updateTotal={this.updateTotal.bind(this)} />
                            <AutoComplete
                                dataSource={this.state.billables}
                                openOnFocus={true}
                                floatingLabelText="Billable"
                                id="trx_entry_billable"
                                ref="trx_entry_billable"
                                style={{marginRight: '25px', width: '105px'}}
                                textFieldStyle={{width: '105px'}}
                                filter={AutoComplete.fuzzyFilter}
                                onNewRequest={this.doesBillableExist}
                                disabled={this.state.disableBillables}
                                errorText={this.state.errors.billable}
                            />
                            <TextField
                                floatingLabelText="Description"
                                underlineDisabledStyle={{color: '#03A9F4'}}
                                underlineStyle={{color: '#03A9F4'}}
                                id="trx_entry_descr"
                                ref="trx_entry_descr"
                                style={{marginRight: '25px', width:'245px'}}
                                errorText={this.state.errors.descr}
                            />
                            <TextField
                                floatingLabelText="Amount"
                                underlineDisabledStyle={{color: '#03A9F4'}}
                                underlineStyle={{color: '#03A9F4'}}
                                id="trx_entry_amt"
                                style={{marginRight: '25px', width:'100px'}}
                                value={this.state.amt}
                                disabled={true}
                                errorText={this.state.errors.amt}
                            />
                            <FlatButton label="Save Transaction" onClick={this.handleSave} style={{color: 'green'}} />
                            <FlatButton label="Clear" onClick={this.handleClear} style={{color: 'red'}} />
                            <Snackbar bodyStyle={{textAlign: 'center'}} open={this.state.snackbarOpen} message={this.state.message} onRequestClose={this.handleClose} autoHideDuration={3000} />
                        </form>
                        <List>
                            <table>
                                <tbody>
                                    {this.state.trx}
                                </tbody>
                            </table>
                        </List>
                    </section>
                </CardText>
            </Card>
        );
    }
}

export {Trx as default};
