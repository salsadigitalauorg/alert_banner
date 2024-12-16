<?php

declare(strict_types=1);

namespace Drupal\alert_banner\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form for Alert Banner module.
 */
final class ConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'alert_banner.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
  ) {
    parent::__construct($configFactory);
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'alert_banner_config_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('alert_banner.settings');

    $form['enable'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable Alert Banners'),
      '#default_value' => $config->get('enable'),
    ];

    $form['show_on_admin'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show on Administration Pages'),
      '#description' => $this->t('This will allow the alert banners to show on backend admin pages as well as the frontend.'),
      '#default_value' => $config->get('show_on_admin'),
    ];

    $form['au_dta_design_system'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Add support for Australian Government Design System'),
      '#description' => $this->t('This will render the alert banners with styling compatible to <a href="https://designsystem.gov.au" target="_blank">Australian Government Design System</a>.'),
      '#default_value' => $config->get('au_dta_design_system'),
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    parent::submitForm($form, $form_state);

    $this->config('alert_banner.settings')
      ->set('enable', $form_state->getValue('enable'))
      ->set('show_on_admin', $form_state->getValue('show_on_admin'))
      ->set('au_dta_design_system', $form_state->getValue('au_dta_design_system'))
      ->save();
  }

}
