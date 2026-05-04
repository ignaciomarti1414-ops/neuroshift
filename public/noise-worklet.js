class WhiteNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = Math.random() * 2 - 1;
      }
    }
    return true;
  }
}

class PinkNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.b5 = 0;
    this.b6 = 0;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        const white = Math.random() * 2 - 1;
        this.b0 = 0.99886 * this.b0 + white * 0.0555179;
        this.b1 = 0.99332 * this.b1 + white * 0.0750759;
        this.b2 = 0.96900 * this.b2 + white * 0.1538520;
        this.b3 = 0.86650 * this.b3 + white * 0.3104856;
        this.b4 = 0.55000 * this.b4 + white * 0.5329522;
        this.b5 = -0.7616 * this.b5 - white * 0.0168980;
        outputChannel[i] = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362;
        outputChannel[i] *= 0.11; // gain compensation
        this.b6 = white * 0.115926;
      }
    }
    return true;
  }
}

class BrownNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastOut = 0;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        const white = Math.random() * 2 - 1;
        outputChannel[i] = (this.lastOut + (0.02 * white)) / 1.02;
        this.lastOut = outputChannel[i];
        outputChannel[i] *= 3.5; // compensate gain
      }
    }
    return true;
  }
}

class GreyNoiseProcessor extends AudioWorkletProcessor {
  // Grey noise is subjected to equal-loudness contours, approximated here
  constructor() {
    super();
    this.lastOut = 0;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        const white = Math.random() * 2 - 1;
        // Simple psychoacoustic approximation: emphasizing high and low
        outputChannel[i] = white * 0.8 + this.lastOut * 0.2;
        this.lastOut = white;
      }
    }
    return true;
  }
}

class GreenNoiseProcessor extends AudioWorkletProcessor {
  // Green noise is commonly known as mid-frequency noise. We can simulate it by passing white noise through a bandpass filter or using a simple moving average.
  // We'll use a crude approximation here using adjacent samples.
  constructor() {
    super();
    this.lastOut1 = 0;
    this.lastOut2 = 0;
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        const white = Math.random() * 2 - 1;
        // Simple bandpass like approximation
        outputChannel[i] = (white - this.lastOut2) * 0.5;
        this.lastOut2 = this.lastOut1;
        this.lastOut1 = white;
      }
    }
    return true;
  }
}

registerProcessor('white-noise-processor', WhiteNoiseProcessor);
registerProcessor('pink-noise-processor', PinkNoiseProcessor);
registerProcessor('brown-noise-processor', BrownNoiseProcessor);
registerProcessor('grey-noise-processor', GreyNoiseProcessor);
registerProcessor('green-noise-processor', GreenNoiseProcessor);
