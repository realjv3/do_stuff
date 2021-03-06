<?php

namespace App\Http\Controllers;

use App\Billable;
use App\Customer;
use App\Util\UtilFacade;
use Illuminate\Http\Request;

class BillablesController extends Controller
{
    /**
     * @param Request $request http request
     * @returns json customer's billables
     */
    public function save(Request $request) {
        $this->validate($request, array(
                'billable_entry_descr' => 'required|string|max:255',
                'billable_entry_type' => array('required', 'alpha', 'regex:/Service|Product/'),
                'billable_entry_unit' => 'required|string|max:15',
                'billable_entry_price' => 'required|numeric|min:0',
            )
        );

        // Sanitize
        $billable = array();
        for($i = 0; $i < count($_POST); $i++) {
            $billable[substr(key($_POST), 15)] = filter_var(current($_POST), FILTER_SANITIZE_FULL_SPECIAL_CHARS, FILTER_FLAG_NO_ENCODE_QUOTES);
            next($_POST);
        }

        // Save billable to database
        $customer = Customer::find($billable['custid']);
        $customer->billable()->updateOrCreate(array('id' => $billable['id']), $billable);

        // sharing Object cur_user, including user's customers and their billables & trx
        $cur_user = UtilFacade::get_user_data_for_view();
        $message = ($_GET['edit'] == 'true') ? 'The billable item was updated.' : 'The billable item was added.';
        return response()->json(['message' => $message, 'cur_user'=> $cur_user, 201]);
    }

    /**
     * Deletes a billable record and all of their transactions
     * @param int
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete($billable_id) {
        Billable::destroy($billable_id);
        //sharing Object cur_user, including user's customers and their billables & trx
        $cur_user = UtilFacade::get_user_data_for_view();
        return response()->json(['message' => 'The billable was deleted.', 'cur_user' => $cur_user, 201]);
    }

}