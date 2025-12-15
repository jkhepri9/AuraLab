import React from "react";

export default function DisclaimerNote({ className = "" }) {
  return (
    <div className={"text-xs text-white/50 leading-relaxed " + className}>
      <p>
        AuraLab is a wellness and sound-experience tool. It is not a medical device and does not
        diagnose, treat, cure, or prevent any disease. If you have a health concern, consult a
        qualified professional.
      </p>
    </div>
  );
}
