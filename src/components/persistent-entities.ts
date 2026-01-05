/**
 * Unified Room Card - Persistent Entities Component
 * 
 * Renders entities that are always visible regardless of state.
 * Supports state-based icons, colors, and animations with tap/hold actions.
 */

import { html, nothing, TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';

import type { 
  HomeAssistant, 
  PersistentEntitiesConfig,
  EntityConfig,
  TapActionConfig,
  StateConfig 
} from '../types';

import { executeAction, type ActionHandler } from './actions';
import { getAnimationClass } from './animations';

// =============================================================================
// TYPES
// =============================================================================

interface EntityRenderContext {
  hass: HomeAssistant;
  entityConfig: EntityConfig;
  defaultIconSize: string;
  element: HTMLElement;
  actionHandler: ActionHandler;
}

// =============================================================================
// MAIN RENDER FUNCTION
// =============================================================================

/**
 * Render the persistent entities section
 * 
 * @param hass - Home Assistant instance
 * @param config - Persistent entities configuration
 * @param element - The parent element (for dispatching events)
 * @param legacyGrid - Whether to use grid-area: persistent for custom grids
 * @param actionHandler - Optional custom action handler (defaults to executeAction)
 */
export function renderPersistentEntities(
  hass: HomeAssistant,
  config: PersistentEntitiesConfig | undefined,
  element: HTMLElement,
  legacyGrid: boolean = false,
  actionHandler?: ActionHandler
): TemplateResult | typeof nothing {
  if (!config?.entities?.length) {
    return nothing;
  }

  const position = config.position || 'right';
  const defaultIconSize = config.icon_size || '21px';
  const gap = config.gap || '4px';

  // Build section styles
  const sectionStyles: Record<string, string> = {
    'gap': gap,
  };

  // Only apply positioning styles in legacy grid mode
  if (legacyGrid) {
    // Handle custom padding or use smart defaults based on position
    if (config.padding) {
      sectionStyles['padding'] = config.padding;
    } else {
      switch (position) {
        case 'left':
          sectionStyles['padding'] = '0 0 1px 14px';
          break;
        case 'center':
          sectionStyles['padding'] = '0 0 1px 0';
          break;
        case 'right':
        default:
          sectionStyles['padding'] = '0 0 1px 2px';
          if (!config.margin) {
            sectionStyles['margin'] = '0 3px 0 0';
          }
          break;
      }
    }

    // Handle custom margin
    if (config.margin) {
      sectionStyles['margin'] = config.margin;
    }

    // Set horizontal alignment
    switch (position) {
      case 'left':
        sectionStyles['justify-self'] = 'start';
        break;
      case 'center':
        sectionStyles['justify-self'] = 'center';
        break;
      case 'right':
      default:
        sectionStyles['justify-self'] = 'end';
        break;
    }
  }

  const classes = {
    'persistent-section': true,
    'legacy-grid': legacyGrid,
  };

  // Default action handler uses executeAction
  const handler: ActionHandler = actionHandler || ((action, entityId) => {
    executeAction(element, hass, action, entityId);
  });

  return html`
    <div class=${classMap(classes)} style=${styleMap(sectionStyles)}>
      ${config.entities.map((entityConfig) => 
        renderPersistentEntity({
          hass,
          entityConfig,
          defaultIconSize,
          element,
          actionHandler: handler,
        })
      )}
    </div>
  `;
}

// =============================================================================
// SINGLE ENTITY RENDER
// =============================================================================

/**
 * Render a single persistent entity
 */
function renderPersistentEntity(context: EntityRenderContext): TemplateResult {
  const { hass, entityConfig, defaultIconSize, element, actionHandler } = context;
  
  const entity = hass.states[entityConfig.entity];
  const isUnavailable = !entity || isEntityUnavailable(entity);
  const state = entity?.state || 'unavailable';
  const domain = entityConfig.entity.split('.')[0];

  // Find state-specific config
  const stateConfig = entityConfig.states?.find(s => s.state === state);

  // Determine icon (priority: state config > entity config > entity attribute > domain default)
  let icon = stateConfig?.icon || entityConfig.icon;
  if (!icon && entity?.attributes.icon) {
    icon = entity.attributes.icon as string;
  }
  if (!icon) {
    icon = getDefaultIcon(domain, state);
  }

  // Determine color (priority: state config > domain state colors > default)
  let color = stateConfig?.color;
  if (!color) {
    color = getEntityColor(domain, state, isUnavailable);
  }

  // Determine animation (priority: state config > entity config)
  const animation = stateConfig?.animation || entityConfig.animation;
  const animationClass = getAnimationClass(animation);

  // Icon size (entity-specific or default)
  const iconSize = entityConfig.icon_size || defaultIconSize;

  // Icon styles
  const iconStyles: Record<string, string> = {
    'width': iconSize,
    'height': iconSize,
    'color': color,
    '--mdc-icon-size': iconSize,
  };

  // Entity classes
  const entityClasses: Record<string, boolean> = {
    'persistent-entity': true,
  };
  
  // Only add animation class if not empty
  if (animationClass) {
    entityClasses[animationClass] = true;
  }

  // Handle tap action
  const handleTap = (e: Event) => {
    e.stopPropagation();
    const action = entityConfig.tap_action || { action: 'more-info' as const };
    actionHandler(action, entityConfig.entity);
  };

  // Handle hold action
  const handleHold = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    if (entityConfig.hold_action) {
      actionHandler(entityConfig.hold_action, entityConfig.entity);
    }
  };

  // Handle double-tap action
  const handleDoubleTap = (e: Event) => {
    e.stopPropagation();
    if (entityConfig.double_tap_action) {
      actionHandler(entityConfig.double_tap_action, entityConfig.entity);
    }
  };

  // Build tooltip
  const friendlyName = entity?.attributes.friendly_name || entityConfig.entity;
  const tooltip = `${friendlyName}: ${state}`;

  return html`
    <div 
      class=${classMap(entityClasses)}
      @click=${handleTap}
      @dblclick=${handleDoubleTap}
      @contextmenu=${handleHold}
      title=${tooltip}
    >
      <ha-icon
        .icon=${icon}
        style=${styleMap(iconStyles)}
      ></ha-icon>
    </div>
  `;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if entity is unavailable
 */
function isEntityUnavailable(entity: { state: string }): boolean {
  return ['unavailable', 'unknown'].includes(entity.state);
}

/**
 * Get default icon for persistent entity based on domain and state
 */
export function getDefaultIcon(domain: string, state: string): string {
  switch (domain) {
    // Lock icons
    case 'lock':
      switch (state) {
        case 'locked': return 'mdi:lock';
        case 'unlocked': return 'mdi:lock-open';
        case 'locking': return 'mdi:lock-clock';
        case 'unlocking': return 'mdi:lock-clock';
        case 'jammed': return 'mdi:lock-alert';
        case 'open': return 'mdi:lock-open-alert';
        default: return 'mdi:lock-question';
      }

    // Binary sensor icons
    case 'binary_sensor':
      return state === 'on' ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';

    // Cover/door/window icons
    case 'cover':
      switch (state) {
        case 'open': return 'mdi:door-open';
        case 'closed': return 'mdi:door-closed';
        case 'opening': return 'mdi:door-open';
        case 'closing': return 'mdi:door-closed';
        default: return 'mdi:door';
      }

    // Switch icons
    case 'switch':
      return state === 'on' ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off';

    // Light icons
    case 'light':
      return state === 'on' ? 'mdi:lightbulb' : 'mdi:lightbulb-off';

    // Person/presence icons
    case 'person':
      return state === 'home' ? 'mdi:account' : 'mdi:account-off';

    // Device tracker icons
    case 'device_tracker':
      return state === 'home' ? 'mdi:home-account' : 'mdi:home-off';

    // Input boolean icons
    case 'input_boolean':
      return state === 'on' ? 'mdi:check-circle' : 'mdi:close-circle';

    // Fan icons
    case 'fan':
      return state === 'on' ? 'mdi:fan' : 'mdi:fan-off';

    // Vacuum icons
    case 'vacuum':
      switch (state) {
        case 'cleaning': return 'mdi:robot-vacuum';
        case 'docked': return 'mdi:robot-vacuum-variant';
        case 'returning': return 'mdi:robot-vacuum';
        case 'error': return 'mdi:robot-vacuum-alert';
        default: return 'mdi:robot-vacuum';
      }

    // Media player icons
    case 'media_player':
      switch (state) {
        case 'playing': return 'mdi:play-circle';
        case 'paused': return 'mdi:pause-circle';
        case 'idle': return 'mdi:stop-circle';
        case 'off': return 'mdi:cast-off';
        default: return 'mdi:cast';
      }

    // Alarm icons
    case 'alarm_control_panel':
      switch (state) {
        case 'armed_home': return 'mdi:shield-home';
        case 'armed_away': return 'mdi:shield-lock';
        case 'armed_night': return 'mdi:shield-moon';
        case 'disarmed': return 'mdi:shield-off';
        case 'triggered': return 'mdi:shield-alert';
        case 'pending': return 'mdi:shield-sync';
        default: return 'mdi:shield';
      }

    // Default
    default:
      return 'mdi:help-circle';
  }
}

/**
 * Get color for persistent entity based on domain and state
 */
export function getEntityColor(domain: string, state: string, isUnavailable: boolean): string {
  if (isUnavailable) {
    return 'var(--disabled-text-color, #9e9e9e)';
  }

  switch (domain) {
    // Lock colors
    case 'lock':
      switch (state) {
        case 'locked': return 'var(--state-lock-locked-color, #43a047)';
        case 'unlocked': return 'var(--state-lock-unlocked-color, #ffc107)';
        case 'locking': return 'var(--state-lock-locking-color, #ffc107)';
        case 'unlocking': return 'var(--state-lock-unlocking-color, #ffc107)';
        case 'jammed': return 'var(--state-lock-jammed-color, #db4437)';
        case 'open': return 'var(--state-lock-open-color, #db4437)';
        default: return 'var(--primary-text-color)';
      }

    // Binary sensor colors
    case 'binary_sensor':
      return state === 'on' 
        ? 'var(--state-binary_sensor-active-color, var(--amber-color, #ffc107))'
        : 'var(--primary-text-color)';

    // Cover colors
    case 'cover':
      switch (state) {
        case 'open': return 'var(--state-cover-open-color, #ffc107)';
        case 'opening': return 'var(--state-cover-open-color, #ffc107)';
        case 'closed': return 'var(--state-cover-closed-color, #43a047)';
        case 'closing': return 'var(--state-cover-closed-color, #43a047)';
        default: return 'var(--primary-text-color)';
      }

    // Switch colors
    case 'switch':
      return state === 'on'
        ? 'var(--state-switch-active-color, var(--amber-color, #ffc107))'
        : 'var(--primary-text-color)';

    // Light colors
    case 'light':
      return state === 'on'
        ? 'var(--state-light-active-color, var(--amber-color, #ffc107))'
        : 'var(--primary-text-color)';

    // Person/presence colors
    case 'person':
    case 'device_tracker':
      return state === 'home'
        ? 'var(--state-person-home-color, #43a047)'
        : 'var(--state-person-away-color, var(--primary-text-color))';

    // Input boolean colors
    case 'input_boolean':
      return state === 'on'
        ? 'var(--state-input_boolean-active-color, var(--amber-color, #ffc107))'
        : 'var(--primary-text-color)';

    // Fan colors
    case 'fan':
      return state === 'on'
        ? 'var(--state-fan-active-color, var(--amber-color, #ffc107))'
        : 'var(--primary-text-color)';

    // Vacuum colors
    case 'vacuum':
      switch (state) {
        case 'cleaning': return 'var(--state-vacuum-cleaning-color, #43a047)';
        case 'returning': return 'var(--state-vacuum-returning-color, #ffc107)';
        case 'error': return 'var(--state-vacuum-error-color, #db4437)';
        default: return 'var(--primary-text-color)';
      }

    // Media player colors
    case 'media_player':
      return state === 'playing'
        ? 'var(--state-media_player-active-color, var(--amber-color, #ffc107))'
        : 'var(--primary-text-color)';

    // Alarm colors
    case 'alarm_control_panel':
      switch (state) {
        case 'armed_home':
        case 'armed_away':
        case 'armed_night': return 'var(--state-alarm-armed-color, #43a047)';
        case 'disarmed': return 'var(--state-alarm-disarmed-color, var(--primary-text-color))';
        case 'triggered': return 'var(--state-alarm-triggered-color, #db4437)';
        case 'pending': return 'var(--state-alarm-pending-color, #ffc107)';
        default: return 'var(--primary-text-color)';
      }

    // Default colors for active-like states
    default:
      const activeStates = ['on', 'home', 'open', 'playing', 'cleaning', 'active', 'true'];
      return activeStates.includes(state)
        ? 'var(--state-active-color, var(--amber-color, #ffc107))'
        : 'var(--primary-text-color)';
  }
}
