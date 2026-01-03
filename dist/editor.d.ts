/**
 * Unified Room Card - Visual Editor
 *
 * GUI editor for configuring the card through Home Assistant's
 * card configuration dialog.
 */
import { LitElement, TemplateResult, nothing } from 'lit';
import { CARD_EDITOR_TAG } from './constants';
import type { HomeAssistant, UnifiedRoomCardConfig } from './types';
export declare class UnifiedRoomCardEditor extends LitElement {
    hass?: HomeAssistant;
    private _config?;
    private _accordionState;
    private _persistentEntityExpanded;
    private _intermittentEntityExpanded;
    private _customColorInputs;
    private _intermittentCustomColorInputs;
    static styles: import("lit").CSSResult;
    /**
     * Set editor configuration
     */
    setConfig(config: UnifiedRoomCardConfig): void;
    protected render(): TemplateResult | typeof nothing;
    /**
     * Render main card configuration section
     */
    private _renderMainSection;
    /**
     * Render persistent entities section - Placeholder
     */
    private _renderPersistentSection;
    /**
     * Render configuration for a single persistent entity
     */
    private _renderPersistentEntityConfig;
    /**
     * Render intermittent entities section - Placeholder
     */
    private _renderIntermittentSection;
    /**
     * Render configuration for a single intermittent entity
     */
    private _renderIntermittentEntityConfig;
    /**
     * Render climate entities section
     */
    private _renderClimateSection;
    /**
     * Render power entities section
     */
    private _renderPowerSection;
    /**
     * Render battery entities section - Placeholder
     */
    private _renderBatterySection;
    /**
     * Render update entities section
     */
    private _renderUpdateSection;
    /**
     * Render grid layout section - Placeholder
     */
    private _renderGridSection;
    /**
     * Toggle accordion section
     */
    private _toggleAccordion;
    /**
     * Handle value changes and dispatch config update
     */
    private _valueChanged;
    /**
     * Handle grid value changes
     */
    private _gridValueChanged;
    /**
     * Handle tap action type changes
     */
    private _tapActionChanged;
    /**
     * Handle tap action data changes (navigation_path, url_path, etc.)
     */
    private _tapActionDataChanged;
    /**
     * Handle climate entity value changes
     */
    private _climateValueChanged;
    /**
     * Handle power entity value changes
     */
    private _powerValueChanged;
    /**
     * Handle persistent entities config changes
     */
    private _persistentValueChanged;
    /**
     * Toggle persistent entity expand state
     */
    private _togglePersistentEntityExpand;
    /**
     * Add new persistent entity
     */
    private _addPersistentEntity;
    /**
     * Remove persistent entity
     */
    private _removePersistentEntity;
    /**
     * Update persistent entity property
     */
    private _updatePersistentEntity;
    /**
     * Add state config to persistent entity
     */
    private _addPersistentEntityState;
    /**
     * Remove state config from persistent entity
     */
    private _removePersistentEntityState;
    /**
     * Update state config in persistent entity
     */
    private _updatePersistentEntityState;
    /**
     * Render color dropdown options grouped by category
     */
    private _renderColorOptions;
    /**
     * Handle color dropdown selection
     */
    private _handleColorSelect;
    /**
     * Update tap/hold action for persistent entity
     */
    private _updatePersistentEntityAction;
    /**
     * Apply domain defaults to persistent entity
     */
    private _applyDomainDefaults;
    /**
     * Toggle intermittent entity expand state
     */
    private _toggleIntermittentEntityExpand;
    /**
     * Add new intermittent entity
     */
    private _addIntermittentEntity;
    /**
     * Remove intermittent entity
     */
    private _removeIntermittentEntity;
    /**
     * Update intermittent section property
     */
    private _intermittentValueChanged;
    /**
     * Update intermittent entity property
     */
    private _updateIntermittentEntity;
    /**
     * Update intermittent entity active_states from comma-separated string
     */
    private _updateIntermittentEntityActiveStates;
    /**
     * Update tap/hold action for intermittent entity
     */
    private _updateIntermittentEntityAction;
    /**
     * Add state config to intermittent entity
     */
    private _addIntermittentEntityState;
    /**
     * Remove state config from intermittent entity
     */
    private _removeIntermittentEntityState;
    /**
     * Update state config in intermittent entity
     */
    private _updateIntermittentEntityState;
    /**
     * Handle color dropdown selection for intermittent entity
     */
    private _handleIntermittentColorSelect;
    /**
     * Apply domain defaults to intermittent entity
     */
    private _applyIntermittentDomainDefaults;
    /**
     * Get human-readable domain name
     */
    private _getDomainDisplayName;
    /**
     * Get color preview style - handles HA CSS variables
     */
    private _getColorPreviewStyle;
    /**
     * Update battery config property
     */
    private _batteryValueChanged;
    /**
     * Update battery action config
     */
    private _batteryActionChanged;
    /**
     * Add battery entity
     */
    private _addBatteryEntity;
    /**
     * Remove battery entity
     */
    private _removeBatteryEntity;
    /**
     * Update battery entity
     */
    private _updateBatteryEntity;
    /**
     * Update update config property
     */
    private _updateValueChanged;
    /**
     * Update update action config
     */
    private _updateActionChanged;
    /**
     * Add update entity
     */
    private _addUpdateEntity;
    /**
     * Remove update entity
     */
    private _removeUpdateEntity;
    /**
     * Update update entity
     */
    private _updateUpdateEntity;
    /**
     * Dispatch config changed event to Home Assistant
     */
    private _dispatchConfigChanged;
}
declare global {
    interface HTMLElementTagNameMap {
        [CARD_EDITOR_TAG]: UnifiedRoomCardEditor;
    }
}
//# sourceMappingURL=editor.d.ts.map