import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class NoMaliciousContentConstraint implements ValidatorConstraintInterface {
  private readonly xssPatterns: RegExp[] = [
    // <script>, javascript:
    /<\s*script/i,
    /javascript\s*:/i,
    /eval\s*\(/i,
    /expression\s*\(/i,

    // onclick=, onload=, onerror=...
    /on\w+\s*=/i,

    // iframe, img, svg
    /<\s*iframe/i,
    /<\s*img/i,
    /<\s*svg/i,

    // document.cookie, window.location
    /document\.cookie/i,
    /window\.location/i,

    // base64, atob, html entity
    /base64_decode/i,
    /atob\s*\(/i,
    /&#x?[0-9a-f]+;/i,

    // data:, srcdoc=, style=
    /data\s*:/i,
    /srcdoc\s*=/i,
    /style\s*=/i,

    // %25xx, %3Cscript
    /%25[0-9a-f]{2}/i,
    /%3C.*script/i,
  ];

  validate(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    // Check against XSS patterns
    for (const pattern of this.xssPatterns) {
      if (pattern.test(value)) {
        return false;
      }
    }

    // Check if value contains HTML tags
    const stripped = this.stripTags(value);
    return stripped === value;
  }

  private stripTags(str: string): string {
    return str.replaceAll(/<[^>]*>/g, '');
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} contains malicious content.`;
  }
}

export function NoMaliciousContent(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'NoMaliciousContent',
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [],
      validator: NoMaliciousContentConstraint,
    });
  };
}
