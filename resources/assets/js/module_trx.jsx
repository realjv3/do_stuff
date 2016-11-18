/**
 * Created by John on 8/22/2016.
 * React components for Trx tracking module
 */

import React from 'react';

import 'whatwg-fetch';
import ES6Promise from 'es6-promise';
ES6Promise.polyfill();

import Stopwatch from 'timer-stopwatch';

import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import AutoComplete from 'material-ui/AutoComplete';
import DatePicker from 'material-ui/DatePicker';
import Paper from 'material-ui/Paper';
import Snackbar from 'material-ui/Snackbar';
import Card from 'material-ui/Card/Card.js';
import CardActions from 'material-ui/Card/CardActions.js';
import CardHeader from 'material-ui/Card/CardHeader.js';
import CardText from 'material-ui/Card/CardText.js';
import Subheader from 'material-ui/Subheader';
import {List, ListItem} from 'material-ui/List'

import States from 'states.jsx';

import {getSelectedCustomer, getSelectedBillable, getTrx, getBillable} from 'util.jsx';

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
        this.updateBillablesDropDown = React.PropTypes.func.isRequired;
        this.state = {
            open: false,
            snackbarOpen: false,
            fields: JSON.parse(JSON.stringify(this.formfields)),
            errors: JSON.parse(JSON.stringify(this.formfields)),
            message: '',
            edit: false
        };
    }

    removeErrors = () => {
        this.setState({errors: JSON.parse(JSON.stringify(this.formfields))})
    }

    handleOpen = (chosen, edit = false) => {
        //find out which customer is selected
        for(var i = 0; i < cur_user.customer.length; i++)
            if(cur_user.customer[i].selected) break;
        var customer = cur_user.customer[i];

        if (edit) { //if editing, chosen is an id, need to pre-fill form with chosen customer's data
            let billbl = getBillable(chosen), tmp = {};
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
    }

    handleSave = () => {
        this.removeErrors();
        var billable = new FormData();
        var fields = Object.keys(this.formfields);
        for(var i = 3; i < fields.length; i++)  //starting at 1 b/c don't want to include 'customer' field in FormData
            billable.set(fields[i], document.getElementById(fields[i]).value);
        billable.set('billable_entry_id', this.state.fields.id);
        billable.set('billable_entry_custid', this.state.fields.custid);
        fetch('save_billable?edit=' + this.state.edit , {
            method: 'post',
            body: billable,
            headers: {'X-CSRF-Token': _token, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json'},
            credentials: 'same-origin'
        }).then((response) => {
            if(response.ok) {   //if save went ok, show Snackbar, update global cur_user & update the cust. drop-down
                response.json().then(
                    (json) => {
                        for(var i = 0; i < cur_user.customer.length; i++)
                            if(cur_user.customer[i].selected) break;
                        cur_user = JSON.parse(json.cur_user);
                        cur_user.customer[i].selected = true;
                        this.setState({message: json.message, snackbarOpen: true});
                        this.props.updateBillablesDropDown();
                    }
                );
            } else {    //flash errors into view
                response.json().then((errors) => {
                    var keys = Object.keys(errors);
                    var fields = {};
                    for(var i = 0; i < keys.length; i++)
                        fields[keys[i]] = errors[keys[i]];
                    this.setState({errors: fields});
                });
            }
        });
    }

    handleClose = () => {
        this.removeErrors();
        this.setState({
            open: false,
            snackbarOpen: false,
            fields: JSON.parse(JSON.stringify(this.formfields))
        });
    }

    render() {
        let title = (this.state.edit) ? "Edit this customer's billable item." : "New billable item. Love it.";
        var style = {width: '115px', marginRight: '30px', display: 'inline-block'};
        const actions = [
            <FlatButton
                label="Save Billable"
                onTouchTap={this.handleSave}
                style={{color: 'green'}}
            />,
            <FlatButton
                label="Cancel"
                onTouchTap={this.handleClose}
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
                            errorText={this.state.errors.descr}
                            id="billable_entry_descr"
                            defaultValue={this.state.fields.descr}
                            errorText={this.state.errors.descr}
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
                                errorText={this.state.errors.type}
                            />
                            <TextField
                                floatingLabelText="Unit"
                                hintText="hourly, pieces, etc."
                                type="text"
                                errorText={this.state.errors.unit}
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
                                errorText={this.state.errors.price}
                                id="billable_entry_price"
                                defaultValue={(this.state.fields.price) ? this.state.fields.price : undefined}
                                style={style}
                            />
                        </div>
                    </fieldset>
                    <Snackbar open={this.state.snackbarOpen} message={this.state.message} onRequestClose={this.handleClose} autoHideDuration={3000} />
                </form>
            </Dialog>
        );
    }
}

class CustomerEntry extends React.Component
{
    constructor(props) {
        super(props);
        this.updateCustomersDropDown = React.PropTypes.func.isRequired;
        this.formfields = {
            cust_entry_company: '',
            cust_entry_first: '',
            cust_entry_last: '',
            cust_entry_email: '',
            cust_entry_addr1: '',
            cust_entry_addr2: '',
            cust_entry_city: '',
            cust_entry_state: '',
            cust_entry_zip: '',
            cust_entry_cell: '',
            cust_entry_office: ''
        }
        this.state = {
            open: false,
            snackbarOpen: false,
            fields: JSON.parse(JSON.stringify(this.formfields)),
            errors: JSON.parse(JSON.stringify(this.formfields)),
            message: '',
            edit: false
        };
    }

    removeErrors = () => {
        this.setState({errors: JSON.parse(JSON.stringify(this.formfields))});
    };

    handleOpen = (chosen, edit = false) => {
        if (edit) { //if editing, chosen is an id, need to pre-fill form with chosen customer's data
            for (var i = 0; i < cur_user.customer.length; i++)
                if(cur_user.customer[i].id == chosen) {
                    var customer = cur_user.customer[i];
                    break;
                }
            this.setState({
                open: true,
                fields: {
                    cust_entry_id: customer.id,
                    cust_entry_company: customer.company,
                    cust_entry_first: customer.first,
                    cust_entry_last: customer.last,
                    cust_entry_email: customer.email,
                    cust_entry_addr1: customer.cust_profile.addr1,
                    cust_entry_addr2: customer.cust_profile.addr2,
                    cust_entry_city: customer.cust_profile.city,
                    cust_entry_state: customer.cust_profile.state,
                    cust_entry_zip: customer.cust_profile.zip,
                    cust_entry_cell: customer.cust_profile.cell,
                    cust_entry_office: customer.cust_profile.office
                },
                edit: edit
            });
        } else {//else if creating, chosen is a string, company field gets default value of input
            var tmp = this.state.fields;
            tmp.cust_entry_company = chosen;
            this.setState({open: true, fields: tmp, edit: edit});
        }
    };

    handleClose = () => {
        this.removeErrors();
        this.setState({
            open: false,
            snackbarOpen: false,
            fields: JSON.parse(JSON.stringify(this.formfields))
        });
    };

    handleSave = () => {
        this.removeErrors();
        var cust = new FormData();
        var fields = Object.keys(this.formfields);
        cust.set('id', this.state.fields.cust_entry_id);
        for(var i = 0; i < fields.length; i++)
            cust.set(fields[i], document.getElementById(fields[i]).value);
        cust.set('cust_entry_state', this.refs.cust_entry_state.state.value);
        fetch('save_customer?edit=' + this.state.edit , {
            method: 'post',
            body: cust,
            headers: {'X-CSRF-Token': _token, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json'},
            credentials: 'same-origin'
        }).then((response) => {
            if(response.ok) {   //if save went ok, show Snackbar, update global cur_user & update the cust. drop-down
                response.json().then(
                    (json) => {
                        cur_user = JSON.parse(json.cur_user);
                        for(var i = 0; i < cur_user.customer.length; i++)
                            if(cur_user.customer[i].company == this.state.fields.company) {
                                cur_user.customer[i].selected = true;
                                break;
                            }
                        this.setState({message: json.message, snackbarOpen: true});
                        this.props.updateCustomersDropDown();
                    }
                );
            } else {    //flash errors into view
                response.json().then(function(errors) {
                    var keys = Object.keys(errors);
                    var fields = {};
                    for(var i = 0; i < keys.length; i++)
                        fields[keys[i]] = errors[keys[i]];
                    this.setState({errors: fields});
                }.bind(this));
            }
        });
    };

    render() {
        const actions = [
            <FlatButton
                label="Save Customer"
                onTouchTap={this.handleSave}
                style={{color: 'green'}}
            />,
            <FlatButton
                label="Cancel"
                onTouchTap={this.handleClose}
                style={{color: 'red'}}
            />
        ], style = {width: 'initial', marginRight: '50px'};
        var title = (this.state.edit) ? "Edit this customer." : "So this is a new customer. Nice.";
        return (
            <Dialog
                title={title}
                actions={actions}
                modal={true}
                open={this.state.open}
                bodyStyle={{overflow: 'auto'}}
            >
                <form id="cust_entry">
                    <fieldset>
                        <TextField
                            floatingLabelText="Company"
                            errorText={this.state.errors.cust_entry_company}
                            id="cust_entry_company"
                            className="profile_field"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_company}
                        />
                        <TextField
                            floatingLabelText="First Name"
                            errorText={this.state.errors.cust_entry_first}
                            id="cust_entry_first"
                            className="profile_field"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_first}
                        />
                        <TextField
                            floatingLabelText="Last Name"
                            errorText={this.state.errors.cust_entry_last}
                            id="cust_entry_last"
                            className="profile_field"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_last}
                        />
                        <TextField
                            floatingLabelText="Email"
                            type="email"
                            errorText={this.state.errors.cust_entry_email}
                            id="cust_entry_email"
                            className="profile_field"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_email}
                        />
                    </fieldset>
                    <fieldset>
                        <TextField
                            style={{ width: '300px'}}
                            floatingLabelText="Address1"
                            hintText="Address1"
                            id="cust_entry_addr1"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_addr1}
                            errorText={this.state.errors.cust_entry_addr1}
                        /><br />
                        <TextField
                            style={{ width: '300px'}}
                            floatingLabelText="Address2"
                            hintText="Address2"
                            id="cust_entry_addr2"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_addr2}
                            errorText={this.state.errors.cust_entry_addr2}
                        /><br />
                        <span style={{paddingTop: '30px', paddingBottom: '30px'}}>
                            <TextField
                                floatingLabelText="City"
                                id="cust_entry_city"
                                className="profile_field"
                                style={style}
                                defaultValue={this.state.fields.cust_entry_city}
                                errorText={this.state.errors.cust_entry_city}
                            />
                            <States
                                defaultValue={this.state.fields.cust_entry_state}
                                error={this.state.errors.cust_entry_state}
                                className="profile_field"
                                style={{top: '17px', width: '50px', paddingRight: '10px'}}
                                id="cust_entry_state"
                                ref="cust_entry_state"
                            />
                            <TextField
                                floatingLabelText="Zip"
                                className="profile_field"
                                id="cust_entry_zip"
                                style={style}
                                defaultValue={this.state.fields.cust_entry_zip}
                                errorText={this.state.errors.cust_entry_zip}
                            />
                        </span><br />
                        <TextField
                            floatingLabelText="Cell"
                            id="cust_entry_cell"
                            type="tel"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_cell}
                            errorText={this.state.errors.cust_entry_cell}
                        />
                        <TextField
                            floatingLabelText="Office"
                            id="cust_entry_office"
                            type="tel"
                            style={style}
                            defaultValue={this.state.fields.cust_entry_office}
                            errorText={this.state.errors.cust_entry_office}
                        />
                    </fieldset>
                    <Snackbar open={this.state.snackbarOpen} message={this.state.message} onRequestClose={this.handleClose} autoHideDuration={3000} />
                </form>
            </Dialog>
        );
    }
}

class DeleteCustomerDialog extends React.Component
{
    constructor(props) {
        super(props);
        this.state = {open: false};
    }
    handleOpen = (id) => {
        this.setState({open: true, id: id});
    }
    handleClose = () => {
        this.setState({open: false});
    }
    render() {
        const actions= [
            <FlatButton label="Cancel" primary={true} onTouchTap={this.handleClose} style={{color: 'red'}}/>,
            <FlatButton label="Continue" primary={true} className={this.state.id} onClick={this.props.deleteCustomer} style={{color: 'green'}}/>
        ];

        return (
            <Dialog
                title="Are you sure you want to do this?"
                actions={actions}
                modal={true}
                open={this.state.open}
                onRequest={this.handleClose}
                >
                Do you really want to permanently delete this customer and all of their transactions?
            </Dialog>
        );
    }
}

class DeleteBillablesDialog extends React.Component
{
    constructor(props) {
        super(props);
        this.state = {open: false};
    }
    handleOpen = (id) => {
        this.setState({open: true, id: id});
    }
    handleClose = () => {
        this.setState({open: false});
    }
    render() {
        const actions= [
            <FlatButton label="Cancel" primary={true} onTouchTap={this.handleClose} style={{color: 'red'}}/>,
            <FlatButton label="Continue" primary={true} className={this.state.id} onClick={this.props.deleteBillable} style={{color: 'green'}}/>
        ];

        return (
            <Dialog
                title="Are you sure you want to do this?"
                actions={actions}
                modal={true}
                open={this.state.open}
                onRequest={this.handleClose}
                >
                Do you really want to permanently delete this billable item and all of the related transactions?
            </Dialog>
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
            let hrs = parseInt((this.stopwatch.ms/1000) / 3600);
            let mins = parseInt(((this.stopwatch.ms/1000) / 60) % 60);
            let secs = parseInt((this.stopwatch.ms/1000) % 60);
            if(hrs.toString().length < 2) hrs = '0'+ hrs.toString();
            if(mins.toString().length < 2) mins = '0'+ mins.toString();
            if(secs.toString().length < 2) secs = '0'+ secs.toString();
            this.setState({time: hrs+':'+mins+':'+secs});
            this.props.updateTotal();
        })
    }
    time = () => {
        if(this.stopwatch == undefined) return;
        if (/^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(this.state.time) == false)
            this.state.time = '00:00:00'; //if user inputs wrong format
        if(this.state.time == '99:59:59') return; //max 100 hours;
        if (this.stopwatch.state) { //pause timer
            this.stopwatch.stop();
        } else {    //resume timer
            this.stopwatch.start();
            this.setState({showTimer: true});
        }
    }
    turnOffTimer = () => {
        this.stopwatch.reset();
        this.setState({showTimer: false});
    }
    handleChange = (event) => {
        this.setState({val: event.currentTarget.value});
    }
    render() {
        return (
            <span>
                <IconButton
                    iconClassName="material-icons"
                    style={{top: '7px', left: '7px', opacity: '0.5'}}
                    tooltip="Track time"
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

class TrxEntry extends React.Component
{
    constructor(props) {
        super(props);
        this.state = {
            customers: this.initCustomers(),
            billables: [],
            trx: [],
            snackbarOpen: false, message: '',
            showDelCustDialog: false,
            disableBillables: true,
            errors: {'trx_entry_trxdt': '', 'trx_entry_customer': '', 'trx_entry_qty': '', 'trx_entry_billable': '', 'trx_entry_amt': ''},
            amt: '$ 0.00'
        };
    }
    initCustomers = () => {
        var customers = [];
        for(var i = 0; i < cur_user.customer.length; i++) {
            var customer = {
                text: cur_user.customer[i].company,
                value: (
                    <MenuItem primaryText={cur_user.customer[i].company} innerDivStyle={{display: 'flex', marginBottom: '9px'}} >
                        <span className="cust_icons" >
                            <IconButton
                                className={cur_user.customer[i].id.toString()}
                                iconClassName="fa fa-pencil"
                                tooltip="Edit Customer"
                                onClick={this.editCust}
                            />
                            <IconButton
                                className={cur_user.customer[i].id.toString()}
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
    }
    deleteCustomer = (event) => {
        this.refs.del_cust_dialog.handleClose();
        var body = new FormData();
        body.append('cust_id', event.currentTarget.getAttribute('class'));
        fetch(
            'delete_customer',
            {method: 'POST', headers: {'X-CSRF-Token': _token, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json'}, credentials: 'same-origin', body: body}
        ).then((response) => {
                if(response.ok) //Remove deleted customer from drop-down and show snackbar
                    response.json().then((json) => {
                        cur_user = JSON.parse(json.cur_user);
                        this.setState({snackbarOpen: true, message: json.message});
                        this.updateCustomers();
                    });
            });
    }
    deleteBillable = (event) => {
        this.refs.del_billables_dialog.handleClose();
        var body = new FormData();
        body.append('id', parseInt(event.currentTarget.getAttribute('class')));
        fetch(
            'delete_billable',
            {method: 'POST', headers: {'X-CSRF-Token': _token, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json'}, credentials: 'same-origin', body: body}
        ).then((response) => {
                if(response.ok) //Remove deleted customer from drop-down and show snackbar
                    response.json().then((json) => {
                        for(var i = 0; i < cur_user.customer.length; i++)
                            if(cur_user.customer[i].selected) break;
                        cur_user = JSON.parse(json.cur_user);
                        cur_user.customer[i].selected = true;
                        this.setState({snackbarOpen: true, message: json.message});
                        this.updateBillables();
                    });
            });
    }
    removeErrors = () => {
        this.setState({errors: {'trxdt': '', 'customer': '', 'qty': '', 'billable': '', 'amt': ''}});
    }
    handleSave = () => {
        this.removeErrors();
        var form = new FormData(document.querySelector('trx_form'));
        form.append('id', document.getElementById('trx_entry_trxid').value);
        form.append('trxdt', document.getElementById('trx_entry_trxdt').value);
        form.append('customer', document.getElementById('trx_entry_customer').value);
        form.append('qty', document.getElementById('trx_entry_qty').value);
        form.append('billable', document.getElementById('trx_entry_billable').value);
        form.append('descr', document.getElementById('trx_entry_descr').value);
        form.append('amt', this.state.amt);
        fetch('/save_trx', {
            method: 'POST',
            body: form,
            headers: {'X-CSRF-Token': _token, "Accept": "application/json"},
            credentials: 'same-origin'
        }).then((response) => {
            if(response.ok) {
                response.json().then((json) => {
                    cur_user = JSON.parse(json.cur_user);
                    this.doesCustExist(document.getElementById('trx_entry_customer').value);
                    this.handleClear();
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
    }
    handleEdit = (event) => {
        //grab selected customer, the trx and it's billable
        let cust = getSelectedCustomer();
        let trx = getTrx(event.currentTarget.id);
        let billable = getBillable(trx.item);
        // Populate form with selected trx
        document.getElementById('trx_entry_trxid').value = trx.id;
        this.refs.trx_entry_trxdt.setState({date: new Date(new Date(trx.trxdt).getUTCFullYear(), new Date(trx.trxdt).getUTCMonth(), new Date(trx.trxdt).getUTCDate())});
        this.refs.trx_entry_customer.setState({searchText: cust.company});
        document.getElementById('trx_entry_qty').value = (trx.amt / billable.price).toFixed(2);
        this.refs.trx_entry_billable.setState({searchText: billable.descr});
        if(trx.descr) {
            this.refs.trx_entry_descr.setState({hasValue: true});
            document.getElementById('trx_entry_descr').value = trx.descr;
        }
        document.getElementById('trx_entry_amt').value = '$ ' + trx.amt;
        // Hitting the save button will call this.handleSave()
    }
    handleDelete = (event) => {
        fetch(
            'del_trx/' + event.currentTarget.id,
            {
                method: 'DELETE',
                headers: {'X-CSRF-Token': _token, 'X-Requested-With': 'XMLHttpRequest'},
                credentials: 'same-origin',
            }
        ).then((response) => {
            if(response.ok)
                response.json().then((json) => {
                    cur_user = JSON.parse(json.cur_user);
                    document.getElementById('trx_entry_trxid').value = null;
                    this.doesCustExist();
                });
        });
    }
    handleClose = () => {
        this.removeErrors();
        this.setState({snackbarOpen: false});
    }
    handleClear = () => {
        this.removeErrors();
        document.getElementById('trx_entry_trxid').value = null;
        document.getElementById('trx_entry_trxdt').value = null;
        if(this.refs.trx_entry_customer.state.searchText != '') this.refs.trx_entry_customer.setState({searchText: ''});
        this.refs.trx_entry_qty.setState({val: ''});
        if(this.refs.trx_entry_billable.state.searchText != '') this.refs.trx_entry_billable.setState({searchText: ''});
        this.refs.trx_entry_descr.setState({hasValue: false});
        document.getElementById('trx_entry_descr').value = null;
        document.getElementById('trx_entry_amt').value = null;
    }
    showDelCustDialog = (event) => {
        this.refs.del_cust_dialog.handleOpen(event.currentTarget.getAttribute('class'));
    }
    showDelBillableDialog = (event) => {
        this.refs.del_billables_dialog.handleOpen(event.currentTarget.getAttribute('class'));
    }
    editCust = (event) => {
        this.refs.cust_entry.handleOpen(event.currentTarget.getAttribute('class'), true);
    }
    editBillable = (event) => {
        this.refs.billables_entry.handleOpen(event.currentTarget.getAttribute('class'), true);
    }
    /**
     * Auto-complete selection/onBlur calls this function with cust object when selecting from drop-down
     * @param object/string chosen - can be a FocusEvent or MenuItem object, or a string, on blur or select
     * @return boolean true if customer exists
     * @return boolean false if customer doesn't exist & opens CustomerEntry dialog
     */
    doesCustExist = (chosen) => {
        let exists = false;
        let input = '';
        this.setState({disableBillables: true});

        // Get input customer
        if (typeof chosen == 'string') { // pressing enter in customer
            if (chosen == '') return false;
            input = chosen;
        } else if(chosen.value) //selecting from customer drop-down - onNewRequest makes 2nd call
            input = chosen.text;
        else if (chosen instanceof FocusEvent) { // onBlur of customer/billables field (during select & tab or click out)
            if (chosen.target.value.length == 0 || !chosen.relatedTarget) return false;
            if (chosen.relatedTarget.nodeName == 'SPAN') //selecting from customer drop-down - onBLur makes 1st call
                return true;
            input = chosen.target.value;
        }

        // check if customer exists and get their billables for drop-down store, else open CustomerEntry/BillableEntry dialog
        for (var i = 0; i < cur_user.customer.length; i++) {
            cur_user.customer[i].selected = false;
            if (cur_user.customer[i].company.toLowerCase().trim() == input.toLowerCase().trim()) {
                cur_user.customer[i].selected = true;
                exists = true;
            }
        }
        if (exists) {
            this.setState({disableBillables: false});
            this.updateBillables();
            this.updateTrx();
            return true;
        } else {
            this.refs.cust_entry.handleOpen(input);
            return false;
        }
    }
    doesBillableExist = (chosen) => {
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
        var cust = getSelectedCustomer();
        if(!cust.billable)
            exists = false;
        else
            for (var j = 0; j < cust.billable.length; j++) {
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
    }
    updateCustomers = () => {
        this.setState({customers: this.initCustomers()});
    }
    updateBillables = () => {
        let billables = [], cust = getSelectedCustomer();
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
    }
    updateTotal = () => {
        let qty = document.getElementById('trx_entry_qty').value, billable = getSelectedBillable();
        if (qty == "" || billable == false) return;
        if (/^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(qty))
            qty = (this.refs.trx_entry_qty.stopwatch.ms / 1000) / 60 / 60;
        else
            qty = parseFloat(qty).toFixed(2);
        let price = parseFloat(billable.price);
        if(price && price != NaN && qty && qty != NaN)
            this.setState({amt: '$ ' + (qty * price).toFixed(2)});
    }
    updateTrx = () => {
        let cust = getSelectedCustomer();
        //Assemble trx rows
        var trx = [
            <tr key={'trx_th'}>
                <th>Edit / Delete</th>
                <th>Trx Date</th>
                <th>Billable</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Amount</th>
            </tr>
        ];
        for(var j = 0; j < cust.custtrx.length; j++) {
            //get each transaction's billable's descr and qty
            let billable = getBillable(cust.custtrx[j].item);
            let qty = (cust.custtrx[j].amt / billable.price).toFixed(2) + ' x $' + billable.price +'/'+billable.unit;
            //render table row
            let style = {
                width: '10px',
                height: '10px',
                margin: '2px'
            };
            let tmp =
                <tr key={'trx_id_' + cust.custtrx[j].id}>
                    <td>
                        <span className="trx_icons" >
                            <IconButton
                                className={cust.custtrx[j].custid.toString()}
                                iconClassName="fa fa-pencil"
                                onClick={this.handleEdit}
                                style={style}
                                id={cust.custtrx[j].id}
                            />
                            <IconButton
                                className={cust.custtrx[j].custid.toString()}
                                iconClassName="fa fa-trash-o"
                                onClick={this.handleDelete}
                                style={style}
                                id={cust.custtrx[j].id}
                            />
                        </span>
                    </td>
                    <td>{cust.custtrx[j].trxdt}</td>
                    <td>{billable.descr}</td>
                    <td>{cust.custtrx[j].descr}</td>
                    <td>{qty}</td>
                    <td>$ {cust.custtrx[j].amt}</td>
                </tr>;
            trx.push(tmp);
        }
        this.setState({trx: trx});
    }
    // AutoComplete components aren't emitting onBlur (see mui issue), therefore setting listener after render, old school
    // https://github.com/callemall/material-ui/issues/2294 says onBlur is fixed, but it's not
    componentDidMount = () => {
        document.getElementById('trx_entry_customer').addEventListener('blur', this.doesCustExist);
        document.getElementById('trx_entry_billable').addEventListener('blur', this.doesBillableExist);
        document.getElementById('trx_entry_qty').addEventListener('blur', this.updateTotal);
    }
    render() {
        return (
            <section>
                <CustomerEntry ref="cust_entry" updateCustomersDropDown={this.updateCustomers} />
                <BillableEntry ref="billables_entry" updateBillablesDropDown={this.updateBillables} />
                <DeleteCustomerDialog ref="del_cust_dialog" showDelCustDialog={this.showDelCustDialog} deleteCustomer={this.deleteCustomer} />
                <DeleteBillablesDialog ref="del_billables_dialog" showDelCustDialog={this.showDelBillableDialog} deleteBillable={this.deleteBillable} />
                <form id="trx_form" className="trx_form" ref="trx_form" >
                    <input type="hidden" id="trx_entry_trxid" />
                    <DatePicker
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
                        style={{marginRight: '25px'}}
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
                        style={{marginRight: '25px'}}
                        filter={(searchText, key) => { return (key.toLowerCase().indexOf(searchText.toLowerCase()) >= 0); }}
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
                        style={{marginRight: '25px', width:'100px'}}
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
                    <Snackbar open={this.state.snackbarOpen} message={this.state.message} onRequestClose={this.handleClose} autoHideDuration={3000} />
                </form>
                <List>
                    <table>
                        <tbody>
                            {this.state.trx}
                        </tbody>
                    </table>
                </List>
            </section>
        );
    }
}

class Trx extends React.Component
{
    constructor(props) {
        console.log('hi');
        super(props);
    }
    render() {
        return (
            <Card className="cards" initiallyExpanded={true}>
                <CardHeader
                    title="Billables"
                    subtitle="Track Time & Expenses"
                    actAsExpander={true}
                    avatar="https://www.dropbox.com/s/4hw9njfnlkgttmf/clock-1.png?dl=1"
                    />
                <CardText expandable={true} style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        flexWrap: 'nowrap'
                    }}>
                    <TrxEntry />
                </CardText>
            </Card>
        );
    }
}

export {Trx as default};