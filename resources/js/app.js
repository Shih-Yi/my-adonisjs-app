// 引入 Bootstrap 的 CSS
import 'bootstrap/dist/css/bootstrap.min.css'
// 在你的 main.js 或 main.ts 中引入 FontAwesome
import '@fortawesome/fontawesome-free/js/all.min.js'

// 引入 Bootstrap 的 JS 和 Popper.js
import * as bootstrap from 'bootstrap'
import '@popperjs/core'

import '../css/app.css'

document.addEventListener('DOMContentLoaded', function (event) {
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
  })

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
})
console.log('Hello World')
$('h1').text('Hello, World!')
