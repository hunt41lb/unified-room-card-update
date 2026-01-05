/**
 * Unified Room Card
 * 
 * A comprehensive room status card for Home Assistant with support for
 * climate, persistent, and intermittent entities.
 */

import { LitElement, html, PropertyValues, TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

// Internal imports
import {
  CARD_NAME,
  CARD_VERSION,
  CARD_DESCRIPTION,
  CARD_TAG,
  CARD_EDITOR_TAG,
  DEFAULT_TAP_ACTION,
  DEFAULT_HOLD_ACTION,
  DEFAULT_DOUBLE_TAP_ACTION,
  COMMON_STATES,
  ICON_HORIZONTAL_POSITION_OPTIONS,
  ICON_VERTICAL_POSITION_OPTIONS,
  DOMAIN_ACTIVE_STATES,
  DOMAIN_DEFAULT_ICONS,
  DOMAIN_STATE_ICONS,
  DOMAIN_STATE_COLORS,
  AnimationType,
} from './constants';

import type {
  HomeAssistant,
  UnifiedRoomCardConfig,
  TapActionConfig,
  ClimateEntitiesConfig,
  PowerEntitiesConfig,
} from './types';

import {
  cardStyles,
  getCardDynamicStyles,
  getAnimationClass,
} from './styles';

// Import editor (side effect: registers the custom element)
import './editor';

// Import components
import { 
  renderClimateSection, 
  renderBatteryEntities, 
  getLowBatteryCount,
  renderUpdateEntities,
  getPendingUpdateCount,
  getSpinInterval,
  isSpinAnimationEnabled,
  renderPersistentEntities,
  renderIntermittentEntities,
  getIntermittentActiveCount,
  executeAction,
  type UpdateAnimationState,
  type ActionHandler
} from './components';

// =============================================================================
// CONSOLE REGISTRATION LOG
// =============================================================================

console.info(
  `%c ${CARD_NAME.toUpperCase()} %c v${CARD_VERSION} `,
  'color: white; background: #3498db; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
  'color: #3498db; background: #ecf0f1; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;'
);

// =============================================================================
// MAIN CARD CLASS
// =============================================================================

@customElement(CARD_TAG)
export class UnifiedRoomCard extends LitElement {
  // ===========================================================================
  // PROPERTIES
  // ===========================================================================

  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: UnifiedRoomCardConfig;
  
  // Tap handling - debounce to prevent double-tap from triggering tap
  private _tapTimeout?: ReturnType<typeof setTimeout>;
  private _tapCount: number = 0;
  private static readonly TAP_DEBOUNCE_MS = 250;

  // Update animation state
  @state() private _updateAnimationState: UpdateAnimationState = { isSpinning: false };
  private _updateSpinTimer?: ReturnType<typeof setInterval>;
  private _spinAnimationTimeout?: ReturnType<typeof setTimeout>;

  // ===========================================================================
  // STATIC STYLES
  // ===========================================================================

  static override styles = cardStyles;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Set card configuration from YAML
   */
  public setConfig(config: UnifiedRoomCardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    this._config = {
      // Defaults
      show_name: true,
      show_icon: true,
      show_state: false,
      show_img_cell: true, // Default to enabled
      icon_animation: 'none',
      tap_action: { action: DEFAULT_TAP_ACTION },
      hold_action: { action: DEFAULT_HOLD_ACTION },
      double_tap_action: { action: DEFAULT_DOUBLE_TAP_ACTION },
      // User overrides
      ...config,
    };
  }

  /**
   * Get card size for layout calculations
   */
  public getCardSize(): number {
    return 2;
  }

  /**
   * Clean up on disconnect
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up tap debounce timer
    if (this._tapTimeout) {
      clearTimeout(this._tapTimeout);
      this._tapTimeout = undefined;
    }
    // Clean up update animation timers
    this._stopUpdateSpinTimer();
  }

  /**
   * Start or restart the update spin animation timer
   */
  private _startUpdateSpinTimer(): void {
    this._stopUpdateSpinTimer();
    
    if (!isSpinAnimationEnabled(this._config?.update_entities)) return;
    if (!this.hass || getPendingUpdateCount(this.hass, this._config?.update_entities) === 0) return;

    const interval = getSpinInterval(this._config?.update_entities);
    
    // Trigger initial spin
    this._triggerUpdateSpin();
    
    // Set up periodic spin
    this._updateSpinTimer = setInterval(() => {
      this._triggerUpdateSpin();
    }, interval);
  }

  /**
   * Stop the update spin animation timer
   */
  private _stopUpdateSpinTimer(): void {
    if (this._updateSpinTimer) {
      clearInterval(this._updateSpinTimer);
      this._updateSpinTimer = undefined;
    }
    if (this._spinAnimationTimeout) {
      clearTimeout(this._spinAnimationTimeout);
      this._spinAnimationTimeout = undefined;
    }
  }

  /**
   * Trigger a single spin animation
   */
  private _triggerUpdateSpin(): void {
    this._updateAnimationState = { isSpinning: true };
    
    // Stop spinning after animation completes (1 second)
    this._spinAnimationTimeout = setTimeout(() => {
      this._updateAnimationState = { isSpinning: false };
    }, 1000);
  }

  /**
   * Return static configuration element for editor
   */
  public static getConfigElement(): HTMLElement {
    return document.createElement(CARD_EDITOR_TAG);
  }

  /**
   * Return stub configuration for card picker
   */
  public static getStubConfig(): Partial<UnifiedRoomCardConfig> {
    return {
      type: `custom:${CARD_TAG}`,
      name: 'Room Name',
      entity: '',
      show_name: true,
      show_icon: true,
    };
  }

  // ===========================================================================
  // UPDATE LIFECYCLE
  // ===========================================================================

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    
    // Apply grid-area to host element for layout-card compatibility
    if (this._config?.grid_area) {
      this.style.gridArea = this._config.grid_area;
    } else {
      this.style.removeProperty('grid-area');
    }

    // Start/restart animation timer when hass or config changes
    if (changedProps.has('hass') || changedProps.has('_config')) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      // Only restart timer if this is the first hass, or config changed
      if (!oldHass || changedProps.has('_config')) {
        this._startUpdateSpinTimer();
      }
    }
  }

  protected override shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_config')) {
      return true;
    }

    // Allow animation state changes to trigger re-render
    if (changedProps.has('_updateAnimationState')) {
      return true;
    }

    if (changedProps.has('hass') && this._config) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      if (!oldHass) return true;

      // Check if any relevant entity states have changed
      return this._hasRelevantStateChanged(oldHass);
    }

    return false;
  }

  /**
   * Check if any entity relevant to this card has changed state
   */
  private _hasRelevantStateChanged(oldHass: HomeAssistant): boolean {
    if (!this._config || !this.hass) return false;

    const entitiesToCheck: string[] = [];

    // Main entity and additional entities
    if (this._config.entity) {
      entitiesToCheck.push(this._config.entity);
    }
    if (this._config.entities?.length) {
      entitiesToCheck.push(...this._config.entities);
    }

    // Persistent entities
    if (this._config.persistent_entities?.entities) {
      entitiesToCheck.push(
        ...this._config.persistent_entities.entities.map((e) => e.entity)
      );
    }

    // Intermittent entities
    if (this._config.intermittent_entities?.entities) {
      entitiesToCheck.push(
        ...this._config.intermittent_entities.entities.map((e) => e.entity)
      );
    }

    // Climate entities
    if (this._config.climate_entities) {
      const climate = this._config.climate_entities;
      if (climate.primary_entities) entitiesToCheck.push(...climate.primary_entities);
      if (climate.temperature_entities) entitiesToCheck.push(...climate.temperature_entities);
      if (climate.humidity_entities) entitiesToCheck.push(...climate.humidity_entities);
      if (climate.air_quality_entities) entitiesToCheck.push(...climate.air_quality_entities);
      if (climate.illuminance_entities) entitiesToCheck.push(...climate.illuminance_entities);
    }

    // Power entities
    if (this._config.power_entities?.entities) {
      entitiesToCheck.push(...this._config.power_entities.entities);
    }

    // Battery entities
    if (this._config.battery_entities?.entities) {
      entitiesToCheck.push(...this._config.battery_entities.entities);
    }

    // Update entities
    if (this._config.update_entities?.entities) {
      entitiesToCheck.push(...this._config.update_entities.entities);
    }

    // Check if any of these entities have changed
    for (const entityId of entitiesToCheck) {
      const oldState = oldHass.states[entityId];
      const newState = this.hass.states[entityId];

      if (oldState !== newState) {
        return true;
      }
    }

    return false;
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================

  protected override render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) {
      return nothing;
    }

    // Get primary entity for display purposes
    const mainEntity = this._getPrimaryEntity();

    // Check if ANY entity in the group is active
    const isActive = this._isGroupActive();

    const cardClasses = {
      'state-on': isActive,
      'state-off': !isActive && !!mainEntity,
    };

    // Calculate border color from border_entity
    const borderStyle = this._getBorderStyle();

    const cardDynamicStyles = getCardDynamicStyles({
      cardHeight: this._config.card_height,
      cardWidth: this._config.card_width,
      gridTemplateAreas: this._config.grid?.template_areas,
      gridTemplateColumns: this._config.grid?.template_columns,
      gridTemplateRows: this._config.grid?.template_rows,
      backgroundColor: this._config.background_color,
      activeBackgroundColor: isActive ? this._config.active_background_color : undefined,
      backgroundGradient: this._config.background_gradient,
      borderStyle: borderStyle,
    });

    // Detect which grid areas are defined in custom grid
    const gridAreas = this._getDefinedGridAreas();

    return html`
      <ha-card
        class=${classMap(cardClasses)}
        style=${cardDynamicStyles}
        @click=${this._handleTap}
        @contextmenu=${this._handleHold}
      >
        ${this._renderName()}
        ${this._renderIcon()}
        ${this.hass ? renderClimateSection(this.hass, this._config?.climate_entities, this._config?.power_entities) : nothing}
        ${this._renderEntitySections(gridAreas)}
      </ha-card>
    `;
  }

  /**
   * Detect which grid areas are defined in custom grid template
   */
  private _getDefinedGridAreas(): {
    hasCustomGrid: boolean;
    hasPersistentArea: boolean;
    hasIntermittentArea: boolean;
    hasBatteryArea: boolean;
    hasUpdateArea: boolean;
  } {
    const customAreas = this._config?.grid?.template_areas || '';
    return {
      hasCustomGrid: customAreas.length > 0,
      hasPersistentArea: customAreas.includes('persistent'),
      hasIntermittentArea: customAreas.includes('intermittent'),
      hasBatteryArea: customAreas.includes('battery'),
      hasUpdateArea: customAreas.includes('update'),
    };
  }

  /**
   * Render entity sections based on grid configuration
   * - Default grid: Everything in unified "status" area
   * - Custom grid with persistent/intermittent: Separate areas, battery/update flow with intermittent
   * - Custom grid with battery/update areas: Those get their own grid areas
   */
  private _renderEntitySections(gridAreas: ReturnType<typeof this._getDefinedGridAreas>): TemplateResult | typeof nothing {
    const { hasCustomGrid, hasPersistentArea, hasIntermittentArea, hasBatteryArea, hasUpdateArea } = gridAreas;
    
    // Check if using any custom grid areas for entities
    const usesCustomEntityAreas = hasPersistentArea || hasIntermittentArea || hasBatteryArea || hasUpdateArea;

    if (!usesCustomEntityAreas) {
      // Default mode: unified status section
      return this._renderStatusSection();
    }

    // Custom grid mode: render sections based on defined areas
    // Battery/update flow with intermittent unless they have their own areas
    const includeBatteryWithIntermittent = !hasBatteryArea;
    const includeUpdateWithIntermittent = !hasUpdateArea;

    return html`
      ${hasPersistentArea && this.hass ? renderPersistentEntities(this.hass, this._config?.persistent_entities, this, true, this._handleEntityAction.bind(this)) : nothing}
      ${hasIntermittentArea && this.hass ? renderIntermittentEntities(
        this.hass,
        this._config?.intermittent_entities,
        this,
        true,
        includeBatteryWithIntermittent,
        includeUpdateWithIntermittent,
        this._config?.battery_entities,
        this._config?.update_entities,
        this._updateAnimationState,
        this._handleEntityAction.bind(this)
      ) : nothing}
      ${hasBatteryArea ? this._renderBatterySection() : nothing}
      ${hasUpdateArea ? this._renderUpdateSection() : nothing}
    `;
  }

  /**
   * Render battery entities in their own grid area (advanced users)
   */
  private _renderBatterySection(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config?.battery_entities) return nothing;
    
    const lowBatteryCount = getLowBatteryCount(this.hass, this._config.battery_entities);
    if (lowBatteryCount === 0) return nothing;

    return html`
      <div class="battery-section legacy-grid">
        ${renderBatteryEntities(this.hass, this._config.battery_entities, this._handleEntityAction.bind(this))}
      </div>
    `;
  }

  /**
   * Render update entities in their own grid area (advanced users)
   */
  private _renderUpdateSection(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config?.update_entities) return nothing;
    
    const pendingUpdateCount = getPendingUpdateCount(this.hass, this._config.update_entities);
    if (pendingUpdateCount === 0) return nothing;

    return html`
      <div class="update-section legacy-grid">
        ${renderUpdateEntities(this.hass, this._config.update_entities, this._handleEntityAction.bind(this), this._updateAnimationState)}
      </div>
    `;
  }

  /**
   * Render combined status section (persistent + intermittent + battery + update)
   * Used with default grid layout
   */
  private _renderStatusSection(): TemplateResult | typeof nothing {
    const hasPersistent = this._config?.persistent_entities?.entities?.length;
    const hasIntermittent = this._config?.intermittent_entities?.entities?.length;
    const hasBattery = this._config?.battery_entities;
    const hasUpdate = this._config?.update_entities;

    // Check if any status content exists
    const lowBatteryCount = this.hass ? getLowBatteryCount(this.hass, this._config?.battery_entities) : 0;
    const pendingUpdateCount = this.hass ? getPendingUpdateCount(this.hass, this._config?.update_entities) : 0;
    
    if (!hasPersistent && !hasIntermittent && lowBatteryCount === 0 && pendingUpdateCount === 0) {
      return nothing;
    }

    return html`
      <div class="status-section">
        ${this.hass ? renderPersistentEntities(this.hass, this._config?.persistent_entities, this, false, this._handleEntityAction.bind(this)) : nothing}
        ${this.hass ? renderIntermittentEntities(
          this.hass,
          this._config?.intermittent_entities,
          this,
          false,  // legacyGrid
          false,  // includeBattery
          false,  // includeUpdate
          undefined,
          undefined,
          undefined,
          this._handleEntityAction.bind(this)
        ) : nothing}
        ${hasBattery && this.hass ? renderBatteryEntities(this.hass, this._config?.battery_entities, this._handleEntityAction.bind(this)) : nothing}
        ${hasUpdate && this.hass ? renderUpdateEntities(this.hass, this._config?.update_entities, this._handleEntityAction.bind(this), this._updateAnimationState) : nothing}
      </div>
    `;
  }

  /**
   * Get border style based on border_entity state
   */
  private _getBorderStyle(): string | undefined {
    if (!this._config?.border_entity || !this.hass) {
      return undefined;
    }

    const entity = this.hass.states[this._config.border_entity];
    if (!entity) {
      return undefined;
    }

    const borderWidth = this._config.border_width || '2px';
    const borderStyle = this._config.border_style || 'solid';
    const borderColor = this._getBorderEntityColor(entity);

    if (!borderColor) {
      return undefined;
    }

    return `${borderWidth} ${borderStyle} ${borderColor}`;
  }

  /**
   * Get border color for entity based on domain and state
   */
  private _getBorderEntityColor(entity: { entity_id: string; state: string; attributes: Record<string, unknown> }): string | undefined {
    const domain = this._getDomain(entity.entity_id);

    // Special handling for climate - use hvac_action
    if (domain === 'climate') {
      const hvacAction = entity.attributes.hvac_action as string | undefined;
      if (hvacAction) {
        switch (hvacAction) {
          case 'heating':
          case 'preheating':
            return 'var(--state-climate-heat-color, #ff8c00)';
          case 'cooling':
            return 'var(--state-climate-cool-color, #2196f3)';
          case 'drying':
            return 'var(--state-climate-dry-color, #8bc34a)';
          case 'fan':
            return 'var(--state-climate-fan_only-color, #00bcd4)';
          case 'idle':
          case 'off':
            return undefined; // No border for idle/off
          default:
            return undefined;
        }
      }
    }

    // Use domain state colors
    const stateColors = DOMAIN_STATE_COLORS[domain];
    if (stateColors && stateColors[entity.state]) {
      // Don't show border for "off" or inactive states (they use primary-text-color)
      const color = stateColors[entity.state];
      if (color === 'var(--primary-text-color)') {
        return undefined;
      }
      return color;
    }

    // Fallback for unknown domains - use active color for "on" states
    if (entity.state === 'on') {
      return 'var(--state-active-color, var(--amber-color, #ffc107))';
    }

    return undefined;
  }

  // ===========================================================================
  // SECTION RENDERERS
  // ===========================================================================

  /**
   * Render card name section
   */
  private _renderName(): TemplateResult | typeof nothing {
    if (!this._config?.show_name || !this._config.name) {
      return nothing;
    }

    return html`
      <div class="name-section">
        ${this._config.name}
      </div>
    `;
  }

  /**
   * Render main icon section
   */
  private _renderIcon(): TemplateResult | typeof nothing {
    // Get primary entity for display purposes
    const mainEntity = this._getPrimaryEntity();
    
    // Check if ANY entity in the group is active
    const isActive = this._isGroupActive();
    
    // Get domain from primary entity
    const domain = this._getPrimaryDomain() || '';

    const showIcon = this._config?.show_icon !== false;
    const showImgCell = this._config?.show_img_cell ?? true;
    const icon = this._config?.icon || this._getDefaultIcon(mainEntity);

    // Get animation class (only when active and animation is configured)
    const animationClass = isActive && this._config?.icon_animation && this._config.icon_animation !== 'none'
      ? getAnimationClass(this._config.icon_animation)
      : '';

    const iconContainerClasses: Record<string, boolean> = {
      'icon-container': true,
      'with-img-cell': showImgCell,
      'active': isActive,
    };
    
    // Only add animation class if it's not empty
    if (animationClass) {
      iconContainerClasses[animationClass] = true;
    }

    // Build icon container styles
    const iconContainerStyles: Record<string, string> = {};

    // Apply spin duration if spin animation is enabled
    if (this._config?.icon_animation === 'spin' && isActive) {
      const spinDuration = this._config?.spin_duration || 2;
      iconContainerStyles['--spin-duration'] = `${spinDuration}s`;
    }
    
    // Apply custom img_cell size if specified
    if (showImgCell && this._config?.img_cell_size) {
      iconContainerStyles['width'] = this._config.img_cell_size;
      iconContainerStyles['height'] = this._config.img_cell_size;
    }
    
    // Apply dynamic background color for active state with img_cell
    // Use averaged color for light groups
    if (isActive && showImgCell) {
      const bgColor = this._getGroupBackgroundColor();
      iconContainerStyles['background-color'] = bgColor;
      iconContainerStyles['background'] = bgColor;
    }

    // Icon styles
    const iconStyles: Record<string, string> = {};
    if (this._config?.icon_size) {
      iconStyles['--mdc-icon-size'] = this._config.icon_size;
      // Also apply size to container when no img_cell
      if (!showImgCell) {
        iconContainerStyles['width'] = this._config.icon_size;
        iconContainerStyles['height'] = this._config.icon_size;
      }
    }
    
    // Determine icon color based on state and configuration
    if (isActive && showImgCell) {
      // For active state with img-cell, use white/contrast color
      iconStyles['color'] = 'var(--text-primary-color, #fff)';
    } else if (mainEntity && isActive) {
      // Active state WITHOUT img_cell - use domain-specific colors
      if (domain === 'light') {
        // Use averaged light color for groups
        iconStyles['color'] = this._getGroupIconColor();
      } else if (domain === 'climate') {
        // Use climate hvac_action colors
        iconStyles['color'] = this._getClimateIconColor(mainEntity);
      } else {
        // Other domains - use generic active color or state color
        const stateColor = this._getEntityStateColor(mainEntity);
        if (stateColor) {
          iconStyles['color'] = stateColor;
        } else {
          iconStyles['color'] = 'var(--state-active-color, var(--amber-color, #ffc107))';
        }
      }
    } else if (mainEntity && domain === 'climate') {
      // Climate not active but may still be heating/cooling - check hvac_action
      iconStyles['color'] = this._getClimateIconColor(mainEntity);
    } else if (mainEntity) {
      // Inactive state - check for domain-specific state color (like lock states)
      const stateColor = this._getEntityStateColor(mainEntity);
      if (stateColor) {
        iconStyles['color'] = stateColor;
      }
    }

    // Build icon section styles for positioning
    const iconSectionStyles: Record<string, string> = {};
    
    // Horizontal positioning
    const hPos = this._config?.icon_horizontal_position || ICON_HORIZONTAL_POSITION_OPTIONS.RIGHT;
    switch (hPos) {
      case ICON_HORIZONTAL_POSITION_OPTIONS.LEFT:
        iconSectionStyles['justify-self'] = 'start';
        break;
      case ICON_HORIZONTAL_POSITION_OPTIONS.CENTER:
        iconSectionStyles['justify-self'] = 'center';
        break;
      case ICON_HORIZONTAL_POSITION_OPTIONS.RIGHT:
      default:
        iconSectionStyles['justify-self'] = 'end';
        break;
    }
    
    // Vertical positioning
    const vPos = this._config?.icon_vertical_position || ICON_VERTICAL_POSITION_OPTIONS.TOP;
    switch (vPos) {
      case ICON_VERTICAL_POSITION_OPTIONS.TOP:
        iconSectionStyles['align-self'] = 'start';
        break;
      case ICON_VERTICAL_POSITION_OPTIONS.CENTER:
        iconSectionStyles['align-self'] = 'center';
        break;
      case ICON_VERTICAL_POSITION_OPTIONS.BOTTOM:
        iconSectionStyles['align-self'] = 'end';
        break;
    }

    return html`
      <div class="icon-section" style=${styleMap(iconSectionStyles)}>
        ${this._config?.show_state && mainEntity
          ? html`<span class="state-text">${mainEntity.state}</span>`
          : nothing}
        <div class="icon-wrapper">
          ${showIcon
            ? html`
                <div 
                  class=${classMap(iconContainerClasses)}
                  style=${styleMap(iconContainerStyles)}
                >
                  <ha-icon
                    .icon=${icon}
                    style=${styleMap(iconStyles)}
                  ></ha-icon>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  /**
   * Get background color for icon based on entity attributes and domain
   * Supports light entities with rgb_color attribute and climate entities with hvac_action
   */
  private _getEntityBackgroundColor(entity?: { entity_id: string; state: string; attributes: Record<string, unknown> }): string {
    const opacity = this._config?.icon_background_opacity ?? 0.3;
    
    if (!entity) {
      return `rgba(255, 193, 7, ${opacity})`; // Amber fallback
    }

    const domain = this._getDomain(entity.entity_id);

    // Climate entities - use hvac_action attribute for actual heating/cooling state
    if (domain === 'climate') {
      const hvacAction = entity.attributes.hvac_action as string | undefined;
      switch (hvacAction) {
        case 'heating':
        case 'preheating':
          return 'var(--state-climate-heat-color, #ff8c00)';
        case 'cooling':
          return 'var(--state-climate-cool-color, #2196f3)';
        case 'drying':
          return 'var(--state-climate-dry-color, #8bc34a)';
        case 'fan':
          return 'var(--state-climate-fan_only-color, #00bcd4)';
        default:
          // idle or off - use secondary background (no colored background)
          return 'var(--secondary-background-color)';
      }
    }

    // Light entities - use rgb_color directly when on
    if (domain === 'light') {
      if (entity.state === 'on') {
        // Use rgb_color if available
        if (entity.attributes.rgb_color) {
          const rgb = entity.attributes.rgb_color as [number, number, number];
          return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
        }
        // Light on but no color capability - use amber
        return `rgba(255, 193, 7, ${opacity})`;
      }
      // Light off - no colored background
      return 'var(--secondary-background-color)';
    }

    // Lock entities - use state-specific colors
    if (domain === 'lock') {
      const stateColor = DOMAIN_STATE_COLORS[domain]?.[entity.state];
      if (stateColor) {
        return stateColor;
      }
      return 'var(--secondary-background-color)';
    }

    // Other entities - check if in active state using domain defaults
    const activeStates = DOMAIN_ACTIVE_STATES[domain] || ['on'];
    if (activeStates.includes(entity.state)) {
      return `rgba(255, 193, 7, ${opacity})`; // Amber for active state
    }

    // Inactive - use secondary background
    return 'var(--secondary-background-color)';
  }

  /**
   * Get icon color for light entity based on its color attributes
   * Used when img_cell is disabled
   */
  private _getLightIconColor(entity: { entity_id: string; state: string; attributes: Record<string, unknown> }): string {
    // Only use rgb_color if light is on and has color
    if (entity.state === 'on' && entity.attributes.rgb_color) {
      const rgb = entity.attributes.rgb_color as [number, number, number];
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    // Lights without color capability - use HA's light active color
    return 'var(--state-light-active-color, var(--amber-color, #ffc107))';
  }

  /**
   * Get icon color for climate entity based on hvac_action attribute
   */
  private _getClimateIconColor(entity: { entity_id: string; state: string; attributes: Record<string, unknown> }): string {
    const hvacAction = entity.attributes.hvac_action as string | undefined;
    switch (hvacAction) {
      case 'heating':
      case 'preheating':
        return 'var(--state-climate-heat-color, #ff8c00)';
      case 'cooling':
        return 'var(--state-climate-cool-color, #2196f3)';
      case 'drying':
        return 'var(--state-climate-dry-color, #8bc34a)';
      case 'fan':
        return 'var(--state-climate-fan_only-color, #00bcd4)';
      default:
        // idle or off - use primary text color
        return 'var(--primary-text-color)';
    }
  }

  /**
   * Check if entity is unavailable
   */
  private _isUnavailable(entity: { state: string }): boolean {
    return ['unavailable', 'unknown'].includes(entity.state);
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Handle entity action (tap/hold) - generic handler for all entity types
   * Wraps executeAction for use as a callback
   */
  private _handleEntityAction(action: TapActionConfig, entityId: string): void {
    if (!this.hass) return;
    executeAction(this, this.hass, action, entityId);
  }

  /**
   * Extract domain from entity_id
   */
  private _getDomain(entityId: string): string {
    return entityId.split('.')[0];
  }

  /**
   * Get all primary entities (entity + entities array)
   * Returns combined array for grouped control
   */
  private _getAllPrimaryEntities(): string[] {
    const entities: string[] = [];
    
    if (this._config?.entity) {
      entities.push(this._config.entity);
    }
    
    if (this._config?.entities?.length) {
      entities.push(...this._config.entities);
    }
    
    return entities;
  }

  /**
   * Get the primary domain (from first entity)
   * Used for domain filtering in editor and icon defaults
   */
  private _getPrimaryDomain(): string | undefined {
    const primaryEntity = this._config?.entity;
    if (!primaryEntity) return undefined;
    return this._getDomain(primaryEntity);
  }

  /**
   * Check if ANY entity in the group is active
   * Returns true if at least one entity is in an active state
   */
  private _isGroupActive(): boolean {
    if (!this.hass) return false;
    
    const entities = this._getAllPrimaryEntities();
    if (entities.length === 0) return false;
    
    return entities.some(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      return this._isEntityActive(entityId, entity.state, entity.attributes);
    });
  }

  /**
   * Get the primary entity state object
   * Returns the first entity for backwards compatibility
   */
  private _getPrimaryEntity(): { entity_id: string; state: string; attributes: Record<string, unknown> } | undefined {
    if (!this.hass || !this._config?.entity) return undefined;
    return this.hass.states[this._config.entity];
  }

  /**
   * Get averaged background color for light groups
   * Averages RGB values from all active lights in the group
   */
  private _getGroupBackgroundColor(): string {
    if (!this.hass) return 'var(--state-active-color, var(--amber-color, #ffc107))';
    
    const entities = this._getAllPrimaryEntities();
    const domain = this._getPrimaryDomain();
    
    // Only average colors for lights
    if (domain !== 'light') {
      const primaryEntity = this._getPrimaryEntity();
      return this._getEntityBackgroundColor(primaryEntity);
    }
    
    const opacity = this._config?.icon_background_opacity ?? 0.3; // Configurable opacity
    
    // Collect RGB values from all active lights
    const rgbValues: { r: number; g: number; b: number }[] = [];
    
    for (const entityId of entities) {
      const entity = this.hass.states[entityId];
      if (!entity || entity.state !== 'on') continue;
      
      const rgb = entity.attributes.rgb_color as [number, number, number] | undefined;
      if (rgb) {
        rgbValues.push({ r: rgb[0], g: rgb[1], b: rgb[2] });
      }
    }
    
    // If we have RGB values, average them with configurable opacity
    if (rgbValues.length > 0) {
      const avgR = Math.round(rgbValues.reduce((sum, c) => sum + c.r, 0) / rgbValues.length);
      const avgG = Math.round(rgbValues.reduce((sum, c) => sum + c.g, 0) / rgbValues.length);
      const avgB = Math.round(rgbValues.reduce((sum, c) => sum + c.b, 0) / rgbValues.length);
      return `rgba(${avgR}, ${avgG}, ${avgB}, ${opacity})`;
    }
    
    // Fallback to primary entity color
    const primaryEntity = this._getPrimaryEntity();
    return this._getEntityBackgroundColor(primaryEntity);
  }

  /**
   * Get averaged icon color for light groups (when no img_cell)
   */
  private _getGroupIconColor(): string {
    if (!this.hass) return 'var(--state-light-active-color, var(--amber-color, #ffc107))';
    
    const entities = this._getAllPrimaryEntities();
    const domain = this._getPrimaryDomain();
    
    // Only average colors for lights
    if (domain !== 'light') {
      const primaryEntity = this._getPrimaryEntity();
      if (!primaryEntity) return 'var(--state-active-color, var(--amber-color, #ffc107))';
      return this._getLightIconColor(primaryEntity);
    }
    
    // Collect RGB values from all active lights
    const rgbValues: { r: number; g: number; b: number }[] = [];
    
    for (const entityId of entities) {
      const entity = this.hass.states[entityId];
      if (!entity || entity.state !== 'on') continue;
      
      const rgb = entity.attributes.rgb_color as [number, number, number] | undefined;
      if (rgb) {
        rgbValues.push({ r: rgb[0], g: rgb[1], b: rgb[2] });
      }
    }
    
    // If we have RGB values, average them
    if (rgbValues.length > 0) {
      const avgR = Math.round(rgbValues.reduce((sum, c) => sum + c.r, 0) / rgbValues.length);
      const avgG = Math.round(rgbValues.reduce((sum, c) => sum + c.g, 0) / rgbValues.length);
      const avgB = Math.round(rgbValues.reduce((sum, c) => sum + c.b, 0) / rgbValues.length);
      return `rgb(${avgR}, ${avgG}, ${avgB})`;
    }
    
    // Fallback
    return 'var(--state-light-active-color, var(--amber-color, #ffc107))';
  }

  /**
   * Check if entity is in an "active" state
   * Uses domain-specific active states, with config override
   * For climate entities, checks hvac_action attribute
   */
  private _isEntityActive(entityId: string, state: string, attributes?: Record<string, unknown>): boolean {
    // If custom active_states defined in config, use those
    if (this._config?.active_states && this._config.active_states.length > 0) {
      return this._config.active_states.includes(state);
    }

    const domain = this._getDomain(entityId);
    
    // Special handling for climate - use hvac_action attribute
    if (domain === 'climate' && attributes) {
      const hvacAction = attributes.hvac_action as string | undefined;
      if (hvacAction) {
        // Active if actually heating, cooling, drying, or fan running
        return ['heating', 'cooling', 'drying', 'fan', 'preheating'].includes(hvacAction);
      }
    }

    // Otherwise, use domain-specific defaults
    const domainActiveStates = DOMAIN_ACTIVE_STATES[domain];
    
    if (domainActiveStates) {
      return domainActiveStates.includes(state);
    }

    // Fallback to common active states
    const fallbackActiveStates = [
      COMMON_STATES.ON,
      COMMON_STATES.UNLOCKED,
      COMMON_STATES.OPEN,
      COMMON_STATES.HOME,
      COMMON_STATES.HEATING,
      COMMON_STATES.COOLING,
    ];
    return fallbackActiveStates.includes(state as typeof fallbackActiveStates[number]);
  }

  /**
   * Get default icon for entity based on domain and state
   * For climate entities, uses hvac_action attribute
   */
  private _getDefaultIcon(entity?: { entity_id: string; state: string; attributes: Record<string, unknown> }): string {
    if (!entity) {
      return 'mdi:home';
    }

    // Use entity's icon if available
    if (entity.attributes.icon) {
      return entity.attributes.icon as string;
    }

    const domain = this._getDomain(entity.entity_id);
    
    // Special handling for climate - use hvac_action for icon
    if (domain === 'climate') {
      const hvacAction = entity.attributes.hvac_action as string | undefined;
      if (hvacAction) {
        switch (hvacAction) {
          case 'heating':
          case 'preheating':
            return 'mdi:fire';
          case 'cooling':
            return 'mdi:snowflake';
          case 'drying':
            return 'mdi:water-percent';
          case 'fan':
            return 'mdi:fan';
          default:
            return 'mdi:thermostat';
        }
      }
    }
    
    // Check for state-specific icon 
    const stateIcons = DOMAIN_STATE_ICONS[domain];
    if (stateIcons && stateIcons[entity.state]) {
      return stateIcons[entity.state];
    }

    // Fall back to domain default icon
    return DOMAIN_DEFAULT_ICONS[domain] || 'mdi:home';
  }

  /**
   * Get state-specific color for entity
   */
  private _getEntityStateColor(entity?: { entity_id: string; state: string; attributes: Record<string, unknown> }): string | undefined {
    if (!entity) return undefined;

    const domain = this._getDomain(entity.entity_id);
    const stateColors = DOMAIN_STATE_COLORS[domain];
    
    if (stateColors && stateColors[entity.state]) {
      return stateColors[entity.state];
    }

    return undefined;
  }

  // ===========================================================================
  // TAP ACTION HANDLERS
  // ===========================================================================

  /**
   * Handle tap action with debounce to detect double-tap
   */
  private _handleTap(ev: Event): void {
    ev.stopPropagation();
    
    this._tapCount++;
    
    // If this is the first tap, start the timer
    if (this._tapCount === 1) {
      this._tapTimeout = setTimeout(() => {
        // Timer expired - it was a single tap
        if (this._tapCount === 1 && this._config?.tap_action) {
          this._handleAction(this._config.tap_action);
        }
        this._tapCount = 0;
      }, UnifiedRoomCard.TAP_DEBOUNCE_MS);
    } else if (this._tapCount === 2) {
      // Second tap arrived - it's a double tap
      if (this._tapTimeout) {
        clearTimeout(this._tapTimeout);
        this._tapTimeout = undefined;
      }
      this._tapCount = 0;
      
      if (this._config?.double_tap_action) {
        this._handleAction(this._config.double_tap_action);
      }
    }
  }

  /**
   * Handle hold (context menu) action
   */
  private _handleHold(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    
    // Cancel any pending tap action
    if (this._tapTimeout) {
      clearTimeout(this._tapTimeout);
      this._tapTimeout = undefined;
    }
    this._tapCount = 0;
    
    if (this._config?.hold_action) {
      this._handleAction(this._config.hold_action);
    }
  }

  /**
   * Execute tap action
   */
  private _handleAction(actionConfig: TapActionConfig): void {
    if (!this.hass || !this._config) return;

    // Get all entities for grouped control
    const allEntities = this._getAllPrimaryEntities();
    const primaryEntityId = this._config.entity;

    switch (actionConfig.action) {
      case 'toggle':
        if (allEntities.length > 0) {
          // Toggle all entities in the group - HA handles arrays natively
          this.hass.callService('homeassistant', 'toggle', {
            entity_id: allEntities,
          });
        }
        break;

      case 'more-info':
        // Show more-info for primary entity only
        if (primaryEntityId) {
          const event = new CustomEvent('hass-more-info', {
            bubbles: true,
            composed: true,
            detail: { entityId: primaryEntityId },
          });
          this.dispatchEvent(event);
        }
        break;

      case 'navigate':
        if (actionConfig.navigation_path) {
          window.history.pushState(null, '', actionConfig.navigation_path);
          const event = new CustomEvent('location-changed', {
            bubbles: true,
            composed: true,
          });
          window.dispatchEvent(event);
        }
        break;

      case 'url':
        if (actionConfig.url_path) {
          window.open(actionConfig.url_path, '_blank');
        }
        break;

      case 'perform-action':
        if (actionConfig.service) {
          const [domain, service] = actionConfig.service.split('.');
          this.hass.callService(domain, service, actionConfig.service_data || {});
        }
        break;

      case 'assist':
        const assistEvent = new CustomEvent('hass-assist', {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(assistEvent);
        break;

      case 'none':
      default:
        break;
    }
  }
}

// =============================================================================
// WINDOW REGISTRATION
// =============================================================================

declare global {
  interface HTMLElementTagNameMap {
    [CARD_TAG]: UnifiedRoomCard;
  }
}

// Register with Home Assistant's custom card registry
(window as Window & { customCards?: Array<{ type: string; name: string; description: string }> }).customCards =
  (window as Window & { customCards?: Array<{ type: string; name: string; description: string }> }).customCards || [];

(window as Window & { customCards?: Array<{ type: string; name: string; description: string }> }).customCards.push({
  type: CARD_TAG,
  name: CARD_NAME.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
  description: CARD_DESCRIPTION,
});
