/**
 * Unified Room Card - Type Definitions
 *
 * All TypeScript interfaces and types for card configuration.
 * These types define the structure of the card's YAML configuration.
 */
import type { AnimationType, TapActionType, UnitHandlingType, IconHorizontalPositionType, IconVerticalPositionType } from './constants';
export interface HomeAssistant {
    states: Record<string, HassEntity>;
    themes: HassThemes;
    language: string;
    config: HassConfig;
    localize: (key: string, ...args: unknown[]) => string;
    callService: (domain: string, service: string, data?: Record<string, unknown>) => Promise<void>;
}
export interface HassEntity {
    entity_id: string;
    state: string;
    attributes: Record<string, unknown>;
    last_changed: string;
    last_updated: string;
    context: {
        id: string;
        parent_id: string | null;
        user_id: string | null;
    };
}
export interface HassThemes {
    default_theme: string;
    themes: Record<string, Record<string, string>>;
}
export interface HassConfig {
    unit_system: {
        temperature: string;
        length: string;
        mass: string;
        volume: string;
    };
}
export interface TapActionConfig {
    action: TapActionType;
    navigation_path?: string;
    url_path?: string;
    service?: string;
    service_data?: Record<string, unknown>;
    target?: {
        entity_id?: string | string[];
        device_id?: string | string[];
        area_id?: string | string[];
    };
}
export interface StateConfig {
    state: string;
    icon?: string;
    color?: string;
    animation?: AnimationType;
}
export interface EntityConfig {
    entity: string;
    icon?: string;
    icon_size?: string;
    states?: StateConfig[];
    active_states?: string[];
    animation?: AnimationType;
    unavailable_icon?: string;
    tap_action?: TapActionConfig;
    hold_action?: TapActionConfig;
    double_tap_action?: TapActionConfig;
}
export interface PersistentEntitiesConfig {
    position?: 'left' | 'center' | 'right';
    icon_size?: string;
    padding?: string;
    margin?: string;
    gap?: string;
    entities?: EntityConfig[];
}
export interface IntermittentEntitiesConfig {
    icon_size?: string;
    gap?: string;
    active_states?: string[];
    animation?: AnimationType;
    entities?: EntityConfig[];
}
export interface ClimateEntitiesConfig {
    primary_entity?: string;
    temperature_entities?: string[];
    humidity_entities?: string[];
    air_quality_entities?: string[];
    illuminance_entities?: string[];
    decimal_places?: number;
    show_temperature_unit?: boolean;
    show_humidity_unit?: boolean;
    show_air_quality_unit?: boolean;
    show_illuminance_unit?: boolean;
}
export interface PowerEntitiesConfig {
    entities?: string[];
    unit_handling?: UnitHandlingType;
    decimal_places?: number;
    show_unit?: boolean;
}
export interface BatteryEntitiesConfig {
    entities?: string[];
    low_threshold?: number;
    icon_size?: string;
    tap_action?: TapActionConfig;
    hold_action?: TapActionConfig;
}
export interface UpdateEntitiesConfig {
    entities?: string[];
    icon?: string;
    icon_size?: string;
    color?: string;
    tap_action?: TapActionConfig;
    hold_action?: TapActionConfig;
}
export interface GridConfig {
    template_areas?: string;
    template_columns?: string;
    template_rows?: string;
}
export interface UnifiedRoomCardConfig {
    type: string;
    name?: string;
    entity?: string;
    show_name?: boolean;
    show_icon?: boolean;
    show_state?: boolean;
    show_img_cell?: boolean;
    animate_icon?: boolean;
    icon?: string;
    icon_size?: string;
    img_cell_size?: string;
    icon_horizontal_position?: IconHorizontalPositionType;
    icon_vertical_position?: IconVerticalPositionType;
    active_states?: string[];
    border_entity?: string;
    border_width?: string;
    border_style?: string;
    tap_action?: TapActionConfig;
    hold_action?: TapActionConfig;
    double_tap_action?: TapActionConfig;
    card_height?: string;
    card_width?: string;
    grid?: GridConfig;
    grid_area?: string;
    persistent_entities?: PersistentEntitiesConfig;
    intermittent_entities?: IntermittentEntitiesConfig;
    climate_entities?: ClimateEntitiesConfig;
    power_entities?: PowerEntitiesConfig;
    battery_entities?: BatteryEntitiesConfig;
    update_entities?: UpdateEntitiesConfig;
    background_color?: string;
    active_background_color?: string;
    background_gradient?: string;
}
export interface EditorAccordionState {
    main: boolean;
    persistent: boolean;
    intermittent: boolean;
    climate: boolean;
    power: boolean;
    battery: boolean;
    update: boolean;
    grid: boolean;
}
export interface ComputedClimateValue {
    value: number | null;
    unit: string;
    label: string;
}
export interface ComputedPowerValue {
    value: number;
    unit: string;
    normalized?: {
        value: number;
        unit: string;
    };
}
export interface EntityDisplayInfo {
    entity_id: string;
    state: string;
    icon: string;
    color: string;
    animation: AnimationType;
    visible: boolean;
    unavailable: boolean;
}
export interface UnifiedRoomCardElement extends HTMLElement {
    hass?: HomeAssistant;
    config?: UnifiedRoomCardConfig;
    setConfig(config: UnifiedRoomCardConfig): void;
    getCardSize(): number;
}
//# sourceMappingURL=types.d.ts.map