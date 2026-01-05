/**
 * Unified Room Card - Intermittent Entities Component
 * 
 * Renders entities that only appear when in an "active" state.
 * Supports device class-specific icons, animations, and optional
 * integration with battery/update entities.
 */

import { html, nothing, TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';

import type { 
  HomeAssistant, 
  IntermittentEntitiesConfig,
  BatteryEntitiesConfig,
  UpdateEntitiesConfig,
  EntityConfig,
  TapActionConfig,
} from '../types';

import { 
  AnimationType,
  DOMAIN_ACTIVE_STATES,
  DOMAIN_DEFAULT_ICONS,
  DOMAIN_STATE_ICONS,
  DOMAIN_STATE_COLORS,
} from '../constants';

import { executeAction, type ActionHandler } from './actions';
import { getAnimationClass } from './animations';
import { renderBatteryEntities, getLowBatteryCount } from './battery-entities';
import { renderUpdateEntities, getPendingUpdateCount, type UpdateAnimationState } from './update-entities';

// =============================================================================
// TYPES
// =============================================================================

interface IntermittentRenderContext {
  hass: HomeAssistant;
  config: IntermittentEntitiesConfig | undefined;
  element: HTMLElement;
  legacyGrid: boolean;
  includeBattery: boolean;
  includeUpdate: boolean;
  batteryConfig?: BatteryEntitiesConfig;
  updateConfig?: UpdateEntitiesConfig;
  updateAnimationState?: UpdateAnimationState;
  actionHandler: ActionHandler;
}

interface EntityRenderContext {
  hass: HomeAssistant;
  entityConfig: EntityConfig;
  defaultIconSize: string;
  sectionAnimation?: AnimationType;
  actionHandler: ActionHandler;
}

// =============================================================================
// BINARY SENSOR DEVICE CLASS ICONS
// =============================================================================

/**
 * Comprehensive device class icons for binary sensors
 * Each device class has on/off icon pairs
 */
const BINARY_SENSOR_DEVICE_CLASS_ICONS: Record<string, { on: string; off: string }> = {
  // Presence & Motion
  motion: { on: 'mdi:motion-sensor', off: 'mdi:motion-sensor-off' },
  occupancy: { on: 'mdi:home-account', off: 'mdi:home-outline' },
  presence: { on: 'mdi:home', off: 'mdi:home-outline' },
  
  // Openings
  door: { on: 'mdi:door-open', off: 'mdi:door-closed' },
  window: { on: 'mdi:window-open', off: 'mdi:window-closed' },
  garage_door: { on: 'mdi:garage-open', off: 'mdi:garage' },
  opening: { on: 'mdi:square-outline', off: 'mdi:square' },
  lock: { on: 'mdi:lock-open', off: 'mdi:lock' },
  
  // Safety & Security
  smoke: { on: 'mdi:smoke-detector-alert', off: 'mdi:smoke-detector' },
  gas: { on: 'mdi:gas-cylinder', off: 'mdi:gas-cylinder' },
  co: { on: 'mdi:molecule-co', off: 'mdi:molecule-co' },
  safety: { on: 'mdi:shield-alert', off: 'mdi:shield-check' },
  tamper: { on: 'mdi:alert', off: 'mdi:check' },
  problem: { on: 'mdi:alert-circle', off: 'mdi:check-circle' },
  
  // Environmental
  moisture: { on: 'mdi:water', off: 'mdi:water-off' },
  cold: { on: 'mdi:snowflake', off: 'mdi:snowflake-off' },
  heat: { on: 'mdi:fire', off: 'mdi:fire-off' },
  light: { on: 'mdi:brightness-7', off: 'mdi:brightness-5' },
  
  // Sound & Vibration
  sound: { on: 'mdi:volume-high', off: 'mdi:volume-off' },
  vibration: { on: 'mdi:vibrate', off: 'mdi:vibrate-off' },
  
  // Power & Battery
  battery: { on: 'mdi:battery-alert', off: 'mdi:battery' },
  battery_charging: { on: 'mdi:battery-charging', off: 'mdi:battery' },
  plug: { on: 'mdi:power-plug', off: 'mdi:power-plug-off' },
  power: { on: 'mdi:flash', off: 'mdi:flash-off' },
  
  // Status
  running: { on: 'mdi:play', off: 'mdi:stop' },
  update: { on: 'mdi:package-up', off: 'mdi:package' },
  connectivity: { on: 'mdi:wifi', off: 'mdi:wifi-off' },
};

// =============================================================================
// MAIN RENDER FUNCTION
// =============================================================================

/**
 * Render the intermittent entities section
 * 
 * @param hass - Home Assistant instance
 * @param config - Intermittent entities configuration
 * @param element - The parent element (for dispatching events)
 * @param legacyGrid - Whether to use grid-area: intermittent for custom grids
 * @param includeBattery - Whether to include battery entities in this section
 * @param includeUpdate - Whether to include update entities in this section
 * @param batteryConfig - Battery entities configuration (if includeBattery)
 * @param updateConfig - Update entities configuration (if includeUpdate)
 * @param updateAnimationState - Animation state for update entities
 * @param actionHandler - Optional custom action handler
 */
export function renderIntermittentEntities(
  hass: HomeAssistant,
  config: IntermittentEntitiesConfig | undefined,
  element: HTMLElement,
  legacyGrid: boolean = false,
  includeBattery: boolean = false,
  includeUpdate: boolean = false,
  batteryConfig?: BatteryEntitiesConfig,
  updateConfig?: UpdateEntitiesConfig,
  updateAnimationState?: UpdateAnimationState,
  actionHandler?: ActionHandler
): TemplateResult | typeof nothing {
  const defaultIconSize = config?.icon_size || '21px';
  const gap = config?.gap || '4px';
  const sectionActiveStates = config?.active_states;
  const sectionAnimation = config?.animation;

  // Filter to only active entities
  const activeEntities = (config?.entities || []).filter(entityConfig => 
    isEntityActive(hass, entityConfig, sectionActiveStates)
  );

  // Check if battery/update have content
  const hasBatteryContent = includeBattery && batteryConfig && 
    getLowBatteryCount(hass, batteryConfig) > 0;
  const hasUpdateContent = includeUpdate && updateConfig &&
    getPendingUpdateCount(hass, updateConfig) > 0;

  // Don't render section if no content at all
  if (activeEntities.length === 0 && !hasBatteryContent && !hasUpdateContent) {
    return nothing;
  }

  const sectionStyles: Record<string, string> = {
    'gap': gap,
  };

  const classes = {
    'intermittent-section': true,
    'legacy-grid': legacyGrid,
  };

  // Default action handler uses executeAction
  const handler: ActionHandler = actionHandler || ((action, entityId) => {
    executeAction(element, hass, action, entityId);
  });

  return html`
    <div class=${classMap(classes)} style=${styleMap(sectionStyles)}>
      ${activeEntities.map((entityConfig) => 
        renderIntermittentEntity({
          hass,
          entityConfig,
          defaultIconSize,
          sectionAnimation,
          actionHandler: handler,
        })
      )}
      ${hasBatteryContent ? renderBatteryEntities(hass, batteryConfig, handler) : nothing}
      ${hasUpdateContent ? renderUpdateEntities(hass, updateConfig, handler, updateAnimationState) : nothing}
    </div>
  `;
}

// =============================================================================
// ACTIVE STATE CHECK
// =============================================================================

/**
 * Check if an intermittent entity should be displayed (is "active")
 * 
 * Priority: entity-specific > section-wide > domain defaults
 */
export function isEntityActive(
  hass: HomeAssistant,
  entityConfig: EntityConfig,
  sectionActiveStates?: string[]
): boolean {
  const entity = hass.states[entityConfig.entity];
  if (!entity) return false;
  
  // Check if unavailable - don't show
  if (['unavailable', 'unknown'].includes(entity.state)) {
    return false;
  }

  const state = entity.state;
  const domain = entityConfig.entity.split('.')[0];
  
  // Priority: entity-specific > section-wide > domain defaults
  const activeStates = entityConfig.active_states || sectionActiveStates || DOMAIN_ACTIVE_STATES[domain] || ['on'];
  
  return activeStates.includes(state);
}

/**
 * Get count of active intermittent entities
 * Useful for determining if section should render
 */
export function getActiveEntityCount(
  hass: HomeAssistant,
  config: IntermittentEntitiesConfig | undefined
): number {
  if (!config?.entities?.length) return 0;
  
  const sectionActiveStates = config.active_states;
  return config.entities.filter(entityConfig => 
    isEntityActive(hass, entityConfig, sectionActiveStates)
  ).length;
}

// =============================================================================
// SINGLE ENTITY RENDER
// =============================================================================

/**
 * Render a single intermittent entity
 */
function renderIntermittentEntity(context: EntityRenderContext): TemplateResult | typeof nothing {
  const { hass, entityConfig, defaultIconSize, sectionAnimation, actionHandler } = context;

  const entity = hass.states[entityConfig.entity];
  if (!entity) return nothing;

  const state = entity.state;
  const domain = entityConfig.entity.split('.')[0];

  // Find state-specific config
  const stateConfig = entityConfig.states?.find(s => s.state === state);

  // Determine icon (priority: state config > entity config > entity attribute > domain/device_class default)
  let icon = stateConfig?.icon || entityConfig.icon;
  if (!icon && entity.attributes.icon) {
    icon = entity.attributes.icon as string;
  }
  if (!icon) {
    icon = getDefaultIcon(domain, state, entity.attributes);
  }

  // Determine color (priority: state config > domain state colors > default)
  let color = stateConfig?.color;
  if (!color) {
    color = getEntityColor(domain, state);
  }

  // Determine animation (priority: state config > entity config > section)
  const animation = stateConfig?.animation || entityConfig.animation || sectionAnimation;
  const animationClass = getAnimationClass(animation);

  // Determine icon size
  const iconSize = entityConfig.icon_size || defaultIconSize;

  // Build icon styles
  const iconStyles: Record<string, string> = {
    '--mdc-icon-size': iconSize,
    'color': color,
  };

  // Build entity classes
  const entityClasses: Record<string, boolean> = {
    'intermittent-entity': true,
  };
  
  // Only add animation class if not empty
  if (animationClass) {
    entityClasses[animationClass] = true;
  }

  // Action handlers
  const tapAction = entityConfig.tap_action || { action: 'more-info' as const };
  const holdAction = entityConfig.hold_action || { action: 'more-info' as const };
  const doubleTapAction = entityConfig.double_tap_action;

  const handleTap = (e: Event) => {
    e.stopPropagation();
    actionHandler(tapAction, entityConfig.entity);
  };

  const handleHold = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    actionHandler(holdAction, entityConfig.entity);
  };

  const handleDoubleTap = (e: Event) => {
    e.stopPropagation();
    if (doubleTapAction) {
      actionHandler(doubleTapAction, entityConfig.entity);
    }
  };

  // Build tooltip
  const friendlyName = entity.attributes.friendly_name || entityConfig.entity;
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
// ICON HELPERS
// =============================================================================

/**
 * Get default icon for intermittent entity based on domain, state, and attributes
 */
export function getDefaultIcon(
  domain: string, 
  state: string, 
  attributes: Record<string, unknown>
): string {
  // Binary sensor has device_class-specific icons
  if (domain === 'binary_sensor') {
    const deviceClass = attributes.device_class as string | undefined;
    return getBinarySensorIcon(deviceClass, state);
  }

  // Check domain state icons from constants
  if (DOMAIN_STATE_ICONS[domain]?.[state]) {
    return DOMAIN_STATE_ICONS[domain][state];
  }

  // Fall back to domain default
  return DOMAIN_DEFAULT_ICONS[domain] || 'mdi:alert-circle';
}

/**
 * Get binary sensor icon based on device_class and state
 */
export function getBinarySensorIcon(deviceClass: string | undefined, state: string): string {
  const isOn = state === 'on';
  
  if (deviceClass && BINARY_SENSOR_DEVICE_CLASS_ICONS[deviceClass]) {
    const icons = BINARY_SENSOR_DEVICE_CLASS_ICONS[deviceClass];
    return isOn ? icons.on : icons.off;
  }

  // Default binary sensor icon
  return isOn ? 'mdi:checkbox-marked-circle' : 'mdi:checkbox-blank-circle-outline';
}

// =============================================================================
// COLOR HELPERS
// =============================================================================

/**
 * Get color for intermittent entity based on domain and state
 */
export function getEntityColor(domain: string, state: string): string {
  // Check domain-specific colors from constants
  if (DOMAIN_STATE_COLORS[domain]?.[state]) {
    return DOMAIN_STATE_COLORS[domain][state];
  }

  // Default: active states get amber, inactive get primary text
  const activeStates = DOMAIN_ACTIVE_STATES[domain] || ['on'];
  if (activeStates.includes(state)) {
    return 'var(--state-active-color, var(--amber-color, #ffc107))';
  }

  return 'var(--primary-text-color)';
}
