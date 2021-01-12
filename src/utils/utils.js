$('body').on('focus', '[contenteditable]', function () {
    const $this = $(this);
    $this.data('before', $this.html());
  }).on('blur keyup paste input', '[contenteditable]', function () {
    const $this = $(this);
    if ($this.data('before') !== $this.html()) {
      $this.data('before', $this.html());
      $this.trigger('change');
    }
  });

  function getEditedContent(id, callBack) {
    $(document).on("change", "#" + id, () => {
        callBack(text = d3.select("#" + id).html());
      })
  }
  
function remButton() {
  d3.select(this).append("button").attr("class", "btn btn-danger m-1 py-0")
    .append("i").attr("class", "fas fa-minus-circle");
}


function plusButton() {
  d3.select(this).append("button").attr("class", "btn btn-success m-1 py-0")
    .append("i").attr("class", "fas fa-plus-circle");
}

function isEqualLists(listA, listB) {
  return(_.difference(listA, listB).length === 0 && _.difference(listB, listA).length === 0 );
}