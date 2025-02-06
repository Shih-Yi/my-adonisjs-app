// resources/js/admin/admin-app.js

// =======================
// 1. Import dependencies
// =======================

// Import jQuery and set it as a global variable
import $ from 'jquery'
window.$ = window.jQuery = $

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'

// Import Bootstrap JS and Popper.js
import * as bootstrap from 'bootstrap'
import '@popperjs/core'

// Import FontAwesome JS
import '@fortawesome/fontawesome-free/js/all.min.js'

// Import AdminLTE
import 'admin-lte/dist/css/adminlte.min.css'
import 'admin-lte/dist/js/adminlte.min.js'

// Import Custom CSS
import '../../css/admin/admin-app.css'

// =======================
// 2. Initialize  Components
// =======================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all elements with data-bs-toggle="popover"
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
  popoverTriggerList.forEach((popoverTriggerEl) => {
    new bootstrap.Popover(popoverTriggerEl)
  })

  // Initialize all elements with data-bs-toggle="tooltip"
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl)
  })

  let url = window.location.href

  // show sidebar by url
  $(function ($) {
    $('.nav li a').each(function () {
      if (this.href === url) {
        $(this).closest('a').addClass('active')
        $(this).parents('.has-treeview').addClass('menu-is-opening')
        $(this).parents('.has-treeview').addClass('menu-open')
        $(this).parents('.has-treeview').find('.treeview-link').addClass('active')
        $(this).parents('.nav-treeview').show()
      }
    })
  })

  // click sidebar link
  $('.nav li a').click(function () {
    $('.nav li a').removeClass('active')
    $('.nav li a').each(function () {
      if (this.href === url) {
        $(this).closest('a').addClass('active')
        $(this).parents('.has-treeview').find('.treeview-link').addClass('active')
      }
    })
  })
})
