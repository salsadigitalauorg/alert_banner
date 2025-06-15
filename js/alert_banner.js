/**
 * @file
 * Provides RESTful API functionality for Alerts block.
 */

(function ($, Drupal, once) {
  'use strict';

  /**
   * Calculate relative luminance for color contrast.
   * Function taken from https://github.com/onury/invert-color
   *
   * @param {string|Array} color - The color value (hex or RGB array).
   * @return {number} The relative luminance value.
   */
  function getLuminance(color) {
    let r, g, b;

    // Handle RGB array
    if (Array.isArray(color)) {
      [r, g, b] = color.map(x => parseInt(x) / 255);
    }
    // Handle RGB string
    else if (color.indexOf('rgb') >= 0) {
      [r, g, b] = color.replace(/rgb\(|\)|\s/gi, '').split(',').map(x => parseInt(x) / 255);
    }
    // Handle hex color
    else if (typeof color === 'string' && color.startsWith('#')) {
      const hex = color.replace('#', '');
      r = parseInt(hex.substr(0, 2), 16) / 255;
      g = parseInt(hex.substr(2, 2), 16) / 255;
      b = parseInt(hex.substr(4, 2), 16) / 255;
    }
    // Default to black if color format is not recognized
    else {
      return 0;
    }

    // Calculate luminance using WCAG formula
    const a = [r, g, b].map(x =>
      x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  /**
   * Parse date from HTML time element.
   * Extracts the datetime attribute value from a time element string
   * and returns a Date object. The Date constructor automatically
   * handles timezone parsing from ISO 8601 formatted strings.
   *
   * @param {string} dateString - The HTML time element string.
   * @return {Date|null} The parsed date or null if invalid.
   */
  function parseDateFromTimeElement(dateString) {
    if (!dateString) {
      return null;
    }
    const match = dateString.match(/datetime="([^"]+)"/);
    if (match && match[1]) {
      // Date constructor handles timezone offsets in ISO 8601 format
      return new Date(match[1]);
    }
    return null;
  }

  /**
   * Check if alert is within its date range.
   *
   * @param {Object} alert_item - The alert object.
   * @return {boolean} Whether alert is within its date range.
   */
  function checkDateVisibility(alert_item) {
    // Get current time in the user's timezone
    // The Date object automatically handles the user's local timezone
    const now = new Date();

    // Check start date
    if (alert_item.field_alert_start_date) {
      const startDate = parseDateFromTimeElement(alert_item.field_alert_start_date);
      if (startDate && now < startDate) {
        return false;
      }
    }

    // Check end date
    if (alert_item.field_alert_end_date) {
      const endDate = parseDateFromTimeElement(alert_item.field_alert_end_date);
      if (endDate && now > endDate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if alert should be visible on current page.
   * Supports exact paths and wildcard patterns (* for any characters except spaces).
   * Special regex characters in paths are automatically escaped to prevent regex errors.
   * The '<front>' token is replaced with '/' for homepage matching.
   *
   * @param {string} page_visibility_string - The page visibility string with newline-separated rules.
   * @return {boolean} Whether alert should be visible.
   */
  function checkPageVisibility(page_visibility_string) {
    if ((typeof page_visibility_string !== 'undefined') && page_visibility_string !== false && page_visibility_string !== "") {
      // Split rules by newlines first
      const page_visibility_rules = page_visibility_string.split(/\r?\n/);
      if (page_visibility_rules.length !== 0) {
        const path = window.location.pathname;
        for (let r = 0, rlen = page_visibility_rules.length; r < rlen; r++) {
          let rule = page_visibility_rules[r].trim();
          
          // Skip empty rules
          if (!rule) {
            continue;
          }
          
          // Replace '<front>' with "/"
          rule = rule.replace('<front>', '/');
          
          // Check for exact match
          if (path === rule) {
            return true;
          }
          // Check for wildcard patterns
          else if (rule.indexOf('*') !== -1) {
            // Escape special regex characters except for *
            let pattern = rule.replace(/[.*+?^${}()|[\]\\]/g, function(match) {
              // Keep * as is for wildcard, escape everything else
              return match === '*' ? '[^ ]*' : '\\' + match;
            });
            
            if (path.match(new RegExp('^' + pattern))) {
              return true;
            }
          }
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Create alert element from alert data.
   *
   * @param {Object} alert_item - The alert object.
   * @return {jQuery} The created alert element.
   */
  function createAlertElement(alert_item) {
    const $alert = $('<article>', {
      'role': 'article',
      'data-alert-id': alert_item.alert_id,
      'class': 'node node--type-alert-banner'
    });

    const $content = $('<div>', {
      'class': 'layout-container container node__content'
    });

    // Set alert type and priority
    if ((typeof alert_item.alert_type !== 'undefined') && (alert_item.alert_type !== "")) {
      $alert.attr('data-alert-type', alert_item.alert_type);
    }
    if ((typeof alert_item.priority !== 'undefined') && (alert_item.priority !== "")) {
      $alert.attr('data-alert-priority', alert_item.priority);
    }

    // Override background color
    if ((typeof alert_item.priority_colour !== 'undefined') && (alert_item.priority_colour !== "")) {
      $alert.attr('style', 'background-color:' + alert_item.priority_colour + ' !important');
    }

    // Set icon
    if ((typeof alert_item.icon !== 'undefined') && alert_item.icon !== false && alert_item.icon !== "") {
      $alert.addClass('alert-icon--' + alert_item.icon);
    }
    else {
      $alert.addClass('alert-icon--none');
    }

    // Set message
    if (typeof alert_item.message !== 'undefined') {
      let alert_message = alert_item.message;
      if ((typeof alert_item.display_date !== 'undefined') && (alert_item.display_date !== "")) {
        alert_message = alert_item.display_date + alert_message;
      }
      $('<div>', {
        'class': 'field clearfix alert-banner-message',
        'html': alert_message
      }).appendTo($content);
    }

    // Add link
    if (typeof alert_item.link !== 'undefined' && alert_item.link !== false && alert_item.link !== "") {
      $('<div>', {
        'class': 'field clearfix alert-banner-link',
        'html': alert_item.link
      }).appendTo($content);
    }
    else {
      $alert.addClass('alert-banner-link--none');
    }

    // Add close button
    if ((typeof alert_item.permanent !== 'undefined') && (alert_item.permanent !== '1')) {
      const label_dismiss = Drupal.t('Dismiss alert');
      $('<button>', {
        'class': 'alert-banner-close',
        'data-alert-id': alert_item.alert_id,
        'aria-label': label_dismiss,
        'html': '<span>' + label_dismiss + '</span>'
      }).appendTo($content);
    }
    else {
      $alert.addClass('no-close-button');
    }

    $alert.append($content);
    return $alert;
  }

  Drupal.behaviors.AlertBannersRestBlock = {
    attach: function (context, settings) {
      // Set alert text color
      $('.alert-banners article.node--type-alert-banner', context).each(function (index, element) {
        const color = element.style.backgroundColor;
        if (color) {
          const threshold = Math.sqrt(1.05 * 0.05) - 0.05;
          const element_class = getLuminance(color) > threshold ? 'alert-contrast--dark' : 'alert-contrast--light';
          $(element).addClass(element_class);
        }
      });

      // Process the Close button of each alert
      $('.alert-banners article.node--type-alert-banner button.alert-banner-close', context).click(function (event) {
        const alert_id = $(event.target).attr('data-alert-id');
        document.cookie = `hide_alert_id_${alert_id}=1; path=/`;
        $('article.node--type-alert-banner[data-alert-id="' + alert_id + '"]').remove();
      });

      // Load alerts from REST endpoint
      $(once('alert-banners', '.alert-banners:not(.alerts-processed)', context)).each(function (index, element) {
        const $element = $(element);
        let endpoint = $element.attr('data-alert-endpoint');
        if ((typeof endpoint === 'undefined') || !endpoint || endpoint.length === 0) {
          endpoint = '/alert-banners?_format=json';
        }

        $.getJSON(endpoint, function (response) {
          if (response.length) {
            const $placeholder = $element;
            $placeholder.html('').addClass('alerts-processed');

            response.forEach(function (alert_item) {
              const alert_id = alert_item.alert_id;

              // Skip if alert is hidden by user session
              if (document.cookie.indexOf('hide_alert_id_' + alert_id) !== -1) {
                return;
              }

              // Check page visibility
              if (!checkPageVisibility(alert_item.page_visibility)) {
                return;
              }

              // Check date visibility
              if (!checkDateVisibility(alert_item)) {
                return;
              }

              // Create and append alert
              const $alert = createAlertElement(alert_item);
              $placeholder.append($alert);

              // Add icons class if needed
              if ((typeof alert_item.icon !== 'undefined') &&
                  alert_item.icon !== false &&
                  alert_item.icon !== "" &&
                  alert_item.icon !== 'none' &&
                  !$placeholder.hasClass('alerts-with-icons')) {
                $placeholder.addClass('alerts-with-icons');
              }
            });

            // Reattach behaviors to ensure proper styling
            Drupal.behaviors.AlertBannersRestBlock.attach(context, settings);
          }
        });
      });
    }
  };
})(jQuery, Drupal, once);
