// $(function () {
//     $('#firstButton').popover({
//       container: "body",
//       html: true,
//       content: function () {
//         return '<div class="popover-message">' + $(this).data("message") + '</div>';
//       }
//     });
//     $('#secondButton').popover(); // <-- The first initializer does this, which causes the next one to fail on the next line.
//     $('#secondButton').popover({
//       container: "body",
//       html: true,
//       content: function () {
//         return '<div class="popover-message">' + $(this).data("message") + '</div>';
//       }
//     });
// });

// $(document).ready(function(){
//   $('[data-toggle="popover"]').popover();
// });
//
// $(".article-text").on("click", ".paragraph", function(e) {
//   var selected_text = window.getSelection().toString();
//   var paragraph = $(this);
//   var paragraph_id = paragraph.attr("paragraph_id")
//   e.stopPropagation();
//   if (selected_text !== "") {
//     paragraph.popover({
//       placement: "auto",
//       trigger: "manual",
//       container: "body",
//       html: true,
//       content: function() {
//         return "Paragraph: " + paragraph_id + "</br>" + "Selected text: " + selected_text;
//       }
//     });
//     paragraph.popover("show");
//   }
// });
//
// // // Remove Popover on Hover
// // $("body").on('mouseenter', '.popover', function(e) {
// // Remove Popover on Hover
// $("body").on('click', '.popover', function(e) {
//   e.stopPropagation();
//   $(this).remove();
// });

// $(function () {
//     $('[data-toggle="popover"]').popover({
//       container: 'body',
//       html: true,
//       placement: 'auto',
//       sanitize: false,
//       content: function() {
//         return $('#reviewComment').html()
//       }
//     })
// });
//
// $(document).ready(function() {
//
//             $('.po-markup > .po-link').popover({
//             trigger: 'click',
//             html: true,  // must have if HTML is contained in popover
//
//             // get the title and conent
//             title: function() {
//                 return $(this).parent().find('.po-title').html();
//             },
//             content: function() {
//                 return $(this).parent().find('.po-body').html();
//             },
//
//             container: 'body',
//             placement: 'auto'
//
//             });
//
//         });

$(".article-text").on("click", ".paragraph", function(e) {
  var selected_text = window.getSelection().toString();
  var paragraph = $(this);
  var paragraph_id = paragraph.attr("paragraph_id")
  // e.stopPropagation();
  if (selected_text !== "") {
    paragraph.popover({
      // trigger: "manual",
      container: 'body',
      html: true,
      placement: 'auto',
      sanitize: false,
      content: function() {
        // return "Paragraph: " + paragraph_id + "</br>" + "Selected text: " + selected_text;
        return $('#reviewComment').html();
      }
    });
    paragraph.popover("show");
    $('#selectedText').text("Selected text: " + selected_text);
  }
});

// // Remove Popover on Hover
// $("body").on('mouseenter', '.popover', function(e) {
// Remove Popover on Hover
$("body").on('click', '.popover', function(e) {
  // e.stopPropagation();
  $(this).remove();
});
//
// $(function(){
//     $('#login').popover({
//
//         placement: 'bottom',
//         title: 'Popover Form',
//         html:true,
//         content:  $('#reviewComment').html()
//     }).on('click', function(){
//       // had to put it within the on click action so it grabs the correct info on submit
//       $('.btn-primary').click(function(){
//        $('#result').after("form submitted by " + $('#email').val())
//         $.post('/echo/html/',  {
//             email: $('#email').val(),
//             name: $('#name').val(),
//             gender: $('#gender').val()
//         }, function(r){
//           $('#pops').popover('hide')
//           $('#result').html('resonse from server could be here' )
//         })
//       })
//   })
// })
