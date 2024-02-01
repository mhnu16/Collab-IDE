import React from "react";
import jQuery from "jquery";

export default function RandButton() {
  function callAPI() {
    jQuery.ajax({
      url: "http://localhost:5000/api/rand",
      type: "GET",
      dataType: "json",
      success: function (result) {
        console.log(result);
        alert("Your random number is " + result["num"]);
      },
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      },
    });
  }

  return (
    <div>
      <button onClick={callAPI}>Click to get a random number</button>
    </div>
  );
}