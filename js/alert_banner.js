/**
 * @file
 * Provides RESTful API functionality for Alerts block.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Calculate luminance from RGB values.
   *
   * @param {Array} c - RGB color array [r, g, b]
   * @return {number} Luminance value
   * 
   * Function taken from https://github.com/onury/invert-color
   */
  function getLuminance(c) {
    var i, x;
    var a = []; // So we don't mutate.
    for (i = 0; i < c.length; i++) {
      x = c[i] / 255;
      a[i] = x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  /**
   * Check if alert should be displayed on current page.
   *
   * @param {string} page_visibility_string - Newline-separated list of paths/patterns
   * @return {boolean} Whether alert should be shown on current page
   */
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

  /**
   * Process and render alerts from REST API response.
   *
   * @param {jQuery} $placeholder - Container element for alerts
   * @param {Array} alerts - Array of alert objects from REST API
   */
  function processAlerts($placeholder, alerts) {
    $placeholder.html('').addClass('alerts-processed');
    
    alerts.forEach(function(alert_item) {
      var alert_id = alert_item.alert_id;
      
      // Skip if alert is hidden by user
      if (document.cookie.indexOf('hide_alert_id_' + alert_id) !== -1) {
        return;
      }
      
      // Check page visibility
      if (!checkPageVisibility(alert_item.page_visibility)) {
        return;
      }
      
      // Create alert element
      var $alert = $('<article>', {
        'role': 'article',
        'data-alert-id': alert_id,
        'class': 'node node--type-alert-banner'
      });
      
      var $content = $('<div>', {
        'class': 'layout-container container node__content'
      });
      
      // Set alert type and priority
      if (alert_item.alert_type) {
        $alert.attr('data-alert-type', alert_item.alert_type);
      }
      if (alert_item.priority !== undefined) {
        $alert.attr('data-alert-priority', alert_item.priority);
      }
      
      // Override background color
      if (alert_item.priority_colour) {
        $alert.attr('style', 'background-color:' + alert_item.priority_colour + ' !important');
      }
      
      // Set icon
      if (alert_item.icon && alert_item.icon !== 'none') {
        $alert.addClass('alert-icon--' + alert_item.icon);
      } else {
        $alert.addClass('alert-icon--none');
      }
      
      // Set message
      if (alert_item.message) {
        var alert_message = alert_item.message;
        if (alert_item.display_date) {
          alert_message = alert_item.display_date + alert_message;
        }
        $('<div>', {
          'class': 'field clearfix alert-banner-message',
          'html': alert_message
        }).appendTo($content);
      }
      
      // Add link
      if (alert_item.link) {
        $('<div>', {
          'class': 'field clearfix alert-banner-link',
          'html': alert_item.link
        }).appendTo($content);
      } else {
        $alert.addClass('alert-banner-link--none');
      }
      
      // Add close button for non-permanent alerts
      if (alert_item.permanent !== '1') {
        var label_dismiss = Drupal.t('Dismiss alert');
        $('<button>', {
          'class': 'alert-banner-close',
          'data-alert-id': alert_id,
          'aria-label': label_dismiss,
          'html': '<span>' + label_dismiss + '</span>'
        }).appendTo($content);
      } else {
        $alert.addClass('no-close-button');
      }
      
      $alert.append($content);
      $placeholder.append($alert);
      
      // Add icons class if needed
      if (alert_item.icon && alert_item.icon !== 'none' && !$placeholder.hasClass('alerts-with-icons')) {
        $placeholder.addClass('alerts-with-icons');
      }
    });
    
    // Reattach behaviors for the new elements
    Drupal.attachBehaviors($placeholder[0]);
  }

  Drupal.behaviors.AlertBannersRestBlock = {
    attach: function (context, settings) {
      // Set cookie with security attributes
      const setCookie = (name, value) => {
        // Add SameSite and Secure attributes for better security
        // Note: Secure requires HTTPS in production
        const isSecure = window.location.protocol === 'https:';
        const cookieString = `${name}=${value};path=/;SameSite=Lax${isSecure ? ';Secure' : ''}`;
        document.cookie = cookieString;
      };
      
      // Process alert banners containers
      once('alert-banners', '.alert-banners:not(.alerts-processed)', context)
        .forEach(function (element) {
          const $element = $(element);
          let endpoint = $element.attr('data-alert-endpoint');
          if (!endpoint || endpoint.length === 0) {
            endpoint = '/alert-banners?_format=json';
          }
          
          // Fetch and process alerts
          fetch(endpoint)
            .then(response => response.json())
            .then(data => {
              if (data && data.length) {
                processAlerts($element, data);
              }
            })
            .catch(error => {
              console.error('Error fetching alerts:', error);
            });
        });

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
      $('.alert-banners article.node--type-alert-banner button.alert-banner-close', context).on('click', function (event) {
        const $button = $(event.currentTarget);
        const alert_id = $button.attr('data-alert-id');
        setCookie('hide_alert_id_' + alert_id, '1');
        $('article.node--type-alert-banner[data-alert-id="' + alert_id + '"]').remove();
      });
    }
  };

})(jQuery, Drupal, once);
