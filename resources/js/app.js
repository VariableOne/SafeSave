
  document.addEventListener("DOMContentLoaded", function() {
    $('#createFolder').on('show.bs.modal', function (event) {
      var button = $(event.relatedTarget); // Button that triggered the modal
      var modal = $(this);
    });
  });
  document.addEventListener("DOMContentLoaded", function() {
    $('#exampleModal').on('show.bs.modal', function (event) {
      var button = $(event.relatedTarget); // Button that triggered the modal
      var fileId = button.data('file-id'); // Extract info from data-* attributes
      var fileName = button.data('file-name');
      
      var modal = $(this);
      modal.find('.modal-title').text('Dateinamen umbenennen für ' + fileName);
      modal.find('#fileToRename').val(fileId);
    });
  });
  document.addEventListener("DOMContentLoaded", function() {
    $('#deleteModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        var fileId = button.data('file-id'); // Extract info from data-* attributes
        var fileName = button.data('file-name');

        var modal = $(this);
        modal.find('.modal-title').text('Datei löschen: ' + fileName);
        modal.find('#fileToDelete').val(fileId);
    });
});
