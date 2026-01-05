/**
 * Components Index
 * 
 * Re-exports all component render functions for easy importing.
 */

export { renderClimateSection } from './climate-section';
export { renderBatteryEntities, getLowBatteryCount } from './battery-entities';
export { 
  renderUpdateEntities, 
  getPendingUpdateCount, 
  getSpinInterval, 
  isSpinAnimationEnabled,
  type UpdateAnimationState 
} from './update-entities';
export { 
  animationKeyframes, 
  animationClasses, 
  PeriodicAnimationController,
  getAnimationClass,
  type AnimationName 
} from './animations';
export {
  executeAction,
  fireMoreInfo,
  toggleEntity,
  navigate,
  openUrl,
  performAction,
  fireAssist,
  getDefaultTapAction,
  getDefaultHoldAction,
  getDefaultDoubleTapAction,
  type ActionHandler
} from './actions';
export {
  renderPersistentEntities,
  getDefaultIcon as getPersistentDefaultIcon,
  getEntityColor as getPersistentEntityColor
} from './persistent-entities';
export {
  renderIntermittentEntities,
  isEntityActive as isIntermittentEntityActive,
  getActiveEntityCount as getIntermittentActiveCount,
  getDefaultIcon as getIntermittentDefaultIcon,
  getBinarySensorIcon,
  getEntityColor as getIntermittentEntityColor
} from './intermittent-entities';
