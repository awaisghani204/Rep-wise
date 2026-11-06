// `expo` re-exports requireNativeModule from expo-modules-core, so no extra dependency is needed.
import { requireNativeModule } from 'expo';

/** JS view of the native "PoseLandmarker" Expo module (PoseLandmarkerModule.kt). */
interface PoseLandmarkerNative {
  /** Bridge_Method: closes the native PoseLandmarker and pauses re-creation (call on background). */
  release(): void;
  /** Bridge_Method: lets the native PoseLandmarker be re-created on the next frame (call on foreground). */
  resume(): void;
}

export default requireNativeModule<PoseLandmarkerNative>('PoseLandmarker');
