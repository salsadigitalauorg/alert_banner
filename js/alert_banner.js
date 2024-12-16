/**
 * @file
 * Provides RESTful API functionality for Alerts block.
 */

(function ($, Drupal, once) {

  'use strict';

  // Function taken from https://github.com/onury/invert-color
  function getLuminance(c) {
    var i, x;
    var a = []; // So we don't mutate.
    for (i = 0; i < c.length; i++) {
      x = c[i] / 255;
      a[i] = x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  function checkPageVisibility(page_visibility_string) {
    if ((typeof page_visibility_string !== 'undefined') && page_visibility_string !== false && page_visibility_string !== "") {
      var page_visibility = page_visibility_string.replace(/\*/g, "[^ ]*");
      // Replace '<front>' with "/".
      page_visibility = page_visibility.replace('<front>', '/');
      // Replace all occurrences of '/' with '\/'.
      page_visibility = page_visibility.replace('/', '\/');
      var page_visibility_rules = page_visibility.split(/\r?\n/);
      if (page_visibility_rules.length !== 0) {
        var path = window.location.pathname;
        for (var r = 0, rlen = page_visibility_rules.length; r < rlen; r++) {
          if (path === page_visibility_rules[r]) {
            return true;
          }
          else if (page_visibility_rules[r].indexOf('*') !== -1 && path.match(new RegExp('^' + page_visibility_rules[r]))) {
            return true;
          }
        }
        return false;
      }
    }
    return true;
  }

  Drupal.behaviors.AlertBannersRestBlock = {
    attach: function (context, settings) {
      // Replace jQuery.cookie with modern alternative
      const setCookie = (name, value) => {
        document.cookie = `${name}=${value};path=/`;
      };
      
      // Use once() instead of jQuery.once()
      once('alert-banners', '.alert-banners:not(.alerts-processed)', context)
        .forEach(function (element) {
          var endpoint = $(element).attr('data-alert-endpoint');
          if ((typeof endpoint == 'undefined') || !endpoint || endpoint.length === 0) {
            endpoint = '/alert-banners?_format=json';
          }
          fetchAlerts(endpoint);
        });
        
      // Use fetch API instead of jQuery.ajax
      const fetchAlerts = async (endpoint) => {
        try {
          const response = await fetch(endpoint);
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('Error fetching alerts:', error);
          return [];
        }
      };

      // Set alert text color.
      $('.alert-banners article.node--type-alert-banner', context).each(function (index, element) {
        var color = element.style.backgroundColor;
        if (color) {
          var threshold = Math.sqrt(1.05 * 0.05) - 0.05;
          if (color.indexOf('rgb') >= 0) {
            color = color.replace(/rgb\(|\)|\s/gi, '').split(',');
          }
          var element_class = 'alert-contrast--light';
          if (getLuminance(color) > threshold) {
            element_class = 'alert-contrast--dark';
          }
        }
        $(element).addClass(element_class);
      });

      // Process the Close button of each alert.
      $('.alert-banners article.node--type-alert-banner button.alert-banner-close', context).click(function (event) {
        var alert_id = $(event.target).attr('data-alert-id');
        setCookie('hide_alert_id_' + alert_id, true);
        $('article.node--type-alert-banner[data-alert-id="' + alert_id + '"]').remove();
      });
    }
  };

})(jQuery, Drupal, once);
