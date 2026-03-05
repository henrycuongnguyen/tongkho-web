// src/components/utility/utility-container.tsx
import { useState } from 'react';
import type { UtilityFormConfig } from '@/services/utility/types';
import UtilityForm from './utility-form';
import UtilityResult from './utility-result';

interface Props {
  config: UtilityFormConfig;
}

/**
 * Container component that manages form and result state
 * Simpler than using global callbacks and manual DOM manipulation
 */
export default function UtilityContainer({ config }: Props) {
  const [resultHtml, setResultHtml] = useState('');

  return (
    <div>
      <UtilityForm config={config} onResult={setResultHtml} />
      <UtilityResult html={resultHtml} />
    </div>
  );
}
