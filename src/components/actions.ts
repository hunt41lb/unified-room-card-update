/**
 * Unified Room Card - Actions Component
 * 
 * Reusable action handling utilities for tap, hold, and double-tap actions.
 * Centralizes all action logic to ensure consistency across components.
 */

import type { HomeAssistant, TapActionConfig } from '../types';

// =============================================================================
// ACTION EXECUTION
// =============================================================================

/**
 * Execute a tap/hold/double-tap action
 * 
 * @param element - The element dispatching the event (for bubbling)
 * @param hass - Home Assistant instance
 * @param action - The action configuration
 * @param entityId - The entity ID to act upon (optional for some actions)
 */
export function executeAction(
  element: HTMLElement,
  hass: HomeAssistant,
  action: TapActionConfig | undefined,
  entityId?: string
): void {
  if (!action || action.action === 'none') return;

  switch (action.action) {
    case 'more-info':
      if (entityId) {
        fireMoreInfo(element, entityId);
      }
      break;

    case 'toggle':
      if (entityId) {
        toggleEntity(hass, entityId);
      }
      break;

    case 'navigate':
      navigate(action.navigation_path);
      break;

    case 'url':
      openUrl(action.url_path);
      break;

    case 'perform-action':
      performAction(hass, action);
      break;

    case 'assist':
      fireAssist(element);
      break;

    case 'none':
    default:
      break;
  }
}

// =============================================================================
// INDIVIDUAL ACTION HANDLERS
// =============================================================================

/**
 * Fire more-info dialog for an entity
 * 
 * @param element - The element dispatching the event
 * @param entityId - The entity ID to show info for
 */
export function fireMoreInfo(element: HTMLElement, entityId: string): void {
  const event = new CustomEvent('hass-more-info', {
    bubbles: true,
    composed: true,
    detail: { entityId },
  });
  element.dispatchEvent(event);
}

/**
 * Toggle an entity's state
 * 
 * @param hass - Home Assistant instance
 * @param entityId - The entity ID to toggle
 */
export function toggleEntity(hass: HomeAssistant, entityId: string): void {
  hass.callService('homeassistant', 'toggle', {
    entity_id: entityId,
  });
}

/**
 * Navigate to a path within Home Assistant
 * 
 * @param path - The navigation path (e.g., '/lovelace/0')
 */
export function navigate(path?: string): void {
  if (!path) return;

  window.history.pushState(null, '', path);
  window.dispatchEvent(
    new CustomEvent('location-changed', {
      bubbles: true,
      composed: true,
    })
  );
}

/**
 * Open a URL in a new browser tab
 * 
 * @param url - The URL to open
 */
export function openUrl(url?: string): void {
  if (!url) return;
  window.open(url, '_blank');
}

/**
 * Perform a service action
 * 
 * @param hass - Home Assistant instance
 * @param action - The action configuration containing service details
 */
export function performAction(hass: HomeAssistant, action: TapActionConfig): void {
  if (!action.service) return;

  const [domain, service] = action.service.split('.');
  if (!domain || !service) return;

  hass.callService(domain, service, action.service_data || {}, action.target);
}

/**
 * Fire the assist dialog
 * 
 * @param element - The element dispatching the event
 */
export function fireAssist(element: HTMLElement): void {
  const event = new CustomEvent('hass-assist', {
    bubbles: true,
    composed: true,
  });
  element.dispatchEvent(event);
}

// =============================================================================
// ACTION CALLBACK TYPE
// =============================================================================

/**
 * Callback type for action handling
 * Used by components to receive action execution from parent
 */
export type ActionHandler = (action: TapActionConfig, entityId: string) => void;

// =============================================================================
// DEFAULT ACTIONS
// =============================================================================

/**
 * Get default tap action for an entity
 */
export function getDefaultTapAction(entityId?: string): TapActionConfig {
  return entityId ? { action: 'more-info' } : { action: 'none' };
}

/**
 * Get default hold action for an entity
 */
export function getDefaultHoldAction(): TapActionConfig {
  return { action: 'none' };
}

/**
 * Get default double-tap action for an entity
 */
export function getDefaultDoubleTapAction(entityId?: string): TapActionConfig {
  return entityId ? { action: 'more-info' } : { action: 'none' };
}
