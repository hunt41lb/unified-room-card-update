/**
 * Unified Room Card
 *
 * A comprehensive room status card for Home Assistant with support for
 * climate, persistent, and intermittent entities.
 */
import { LitElement, PropertyValues, TemplateResult, nothing } from 'lit';
import { CARD_TAG } from './constants';
import type { HomeAssistant, UnifiedRoomCardConfig } from './types';
import './editor';
export declare class UnifiedRoomCard extends LitElement {
    hass?: HomeAssistant;
    private _config?;
    private _tapTimeout?;
    private _tapCount;
    private static readonly TAP_DEBOUNCE_MS;
    static styles: import("lit").CSSResult;
    /**
     * Set card configuration from YAML
     */
    setConfig(config: UnifiedRoomCardConfig): void;
    /**
     * Get card size for layout calculations
     */
    getCardSize(): number;
    /**
     * Clean up on disconnect
     */
    disconnectedCallback(): void;
    /**
     * Return static configuration element for editor
     */
    static getConfigElement(): HTMLElement;
    /**
     * Return stub configuration for card picker
     */
    static getStubConfig(): Partial<UnifiedRoomCardConfig>;
    protected updated(changedProps: PropertyValues): void;
    protected shouldUpdate(changedProps: PropertyValues): boolean;
    /**
     * Check if any entity relevant to this card has changed state
     */
    private _hasRelevantStateChanged;
    protected render(): TemplateResult | typeof nothing;
    /**
     * Check if user is using legacy grid areas (separate persistent/intermittent)
     */
    private _usesLegacyGridAreas;
    /**
     * Render combined status section (persistent + intermittent)
     * Used with default grid layout
     */
    private _renderStatusSection;
    /**
     * Get border style based on border_entity state
     */
    private _getBorderStyle;
    /**
     * Get border color for entity based on domain and state
     */
    private _getBorderEntityColor;
    /**
     * Render card name section
     */
    private _renderName;
    /**
     * Render main icon section
     */
    private _renderIcon;
    /**
     * Get background color for icon based on entity attributes and domain
     * Supports light entities with rgb_color attribute and climate entities with hvac_action
     */
    private _getEntityBackgroundColor;
    /**
     * Get icon color for light entity based on its color attributes
     * Used when img_cell is disabled
     */
    private _getLightIconColor;
    /**
     * Get icon color for climate entity based on hvac_action attribute
     */
    private _getClimateIconColor;
    /**
     * Convert HS color to RGB
     */
    private _hsToRgb;
    /**
     * Render climate section (temperature, humidity, air quality, illuminance, power)
     */
    private _renderClimateSection;
    /**
     * Get temperature value from primary entity or averaged from multiple entities
     */
    private _getTemperatureValue;
    /**
     * Get humidity value averaged from multiple entities
     */
    private _getHumidityValue;
    /**
     * Get air quality value averaged from multiple entities
     */
    private _getAirQualityValue;
    /**
     * Get illuminance value averaged from multiple entities
     */
    private _getIlluminanceValue;
    /**
     * Get power consumption value summed from multiple entities
     */
    private _getPowerValue;
    /**
     * Calculate average from multiple entity states
     */
    private _calculateAverage;
    /**
     * Check if entity is unavailable
     */
    private _isUnavailable;
    /**
     * Render persistent entities section
     * These entities are always visible regardless of state
     * @param legacyGrid - If true, uses grid-area: persistent for custom grid layouts
     */
    private _renderPersistentEntities;
    /**
     * Render a single persistent entity
     */
    private _renderPersistentEntity;
    /**
     * Get default icon for persistent entity based on domain and state
     */
    private _getPersistentEntityDefaultIcon;
    /**
     * Get color for persistent entity based on domain and state
     */
    private _getPersistentEntityColor;
    /**
     * Handle action for persistent entity
     */
    private _handlePersistentAction;
    /**
     * Fire more-info dialog for entity
     */
    private _fireMoreInfo;
    /**
     * Render intermittent entities section
     * Only shows entities when they are in an "active" state
     * @param legacyGrid - If true, uses grid-area: intermittent for custom grid layouts
     */
    private _renderIntermittentEntities;
    /**
     * Check if an intermittent entity should be displayed (is "active")
     */
    private _isIntermittentEntityActive;
    /**
     * Render a single intermittent entity
     */
    private _renderIntermittentEntity;
    /**
     * Get default icon for intermittent entity based on domain and state
     */
    private _getIntermittentEntityDefaultIcon;
    /**
     * Get binary sensor icon based on device_class and state
     */
    private _getBinarySensorIcon;
    /**
     * Get color for intermittent entity based on domain and state
     */
    private _getIntermittentEntityColor;
    /**
     * Handle action for intermittent entity
     */
    private _handleIntermittentAction;
    /**
     * Get list of entities with low battery
     */
    private _getLowBatteryEntities;
    /**
     * Get count of entities with low battery (for status section check)
     */
    private _getLowBatteryCount;
    /**
     * Get battery level from entity
     */
    private _getBatteryLevel;
    /**
     * Render battery entities (like intermittent - only shows low batteries)
     */
    private _renderBatteryEntities;
    /**
     * Render a single battery entity
     */
    private _renderBatteryEntity;
    /**
     * Get battery icon based on level
     */
    private _getBatteryIcon;
    /**
     * Handle battery entity action
     */
    private _handleBatteryAction;
    /**
     * Get list of entities with pending updates
     */
    private _getPendingUpdateEntities;
    /**
     * Get count of entities with pending updates (for status section check)
     */
    private _getPendingUpdateCount;
    /**
     * Render update entities (like intermittent - only shows pending updates)
     */
    private _renderUpdateEntities;
    /**
     * Render a single update entity
     */
    private _renderUpdateEntity;
    /**
     * Handle update entity action
     */
    private _handleUpdateAction;
    /**
     * Extract domain from entity_id
     */
    private _getDomain;
    /**
     * Check if entity is in an "active" state
     * Uses domain-specific active states, with config override
     * For climate entities, checks hvac_action attribute
     */
    private _isEntityActive;
    /**
     * Get default icon for entity based on domain and state
     * For climate entities, uses hvac_action attribute
     */
    private _getDefaultIcon;
    /**
     * Get state-specific color for entity
     */
    private _getEntityStateColor;
    /**
     * Handle tap action with debounce to detect double-tap
     */
    private _handleTap;
    /**
     * Handle hold (context menu) action
     */
    private _handleHold;
    /**
     * Execute tap action
     */
    private _handleAction;
}
declare global {
    interface HTMLElementTagNameMap {
        [CARD_TAG]: UnifiedRoomCard;
    }
}
//# sourceMappingURL=unified-room-card.d.ts.map