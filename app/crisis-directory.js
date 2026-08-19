/**
 * inCommon Crisis Directory, Self Help Yellow Pages
 * UMD module, no dependencies, offline-first.
 * Version: 1.0.1
 *
 * Pure data. No profile access, no network, no rendering.
 * Same shape as tarot.js, astropedia.js and hd-atlas.js.
 *
 * CHANGES FROM THE 1.0.0 DRAFT (see PROJECT_MEMORY V1.5.2):
 *   - eatingDisorders: NEDA closed its human helpline in June 2023. The number
 *     800-931-2237 was acquired by the National Alliance for Eating Disorders
 *     and redirects to 866-662-1235. The Alliance is now the primary entry and
 *     the NEDA number is carried as a redirect note, not as a live helpline.
 *   - all() no longer writes _category onto the shared entry objects.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CrisisDirectory = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function entry(name, opts) {
    return {
      name: name,
      phone: opts.phone || null,
      text: opts.text || null,
      chat: opts.chat || null,
      email: opts.email || null,
      hours: opts.hours || '24/7',
      description: opts.description || '',
      tags: opts.tags || [],
      country: opts.country || 'US',
      crisis: opts.crisis || false,
      note: opts.note || null
    };
  }

  var DIR = {

    // 1. SUICIDE AND CRISIS (GENERAL)
    suicideCrisis: [
      entry('988 Suicide & Crisis Lifeline', {
        phone: '988',
        text: '988',
        chat: 'https://988lifeline.org',
        hours: '24/7',
        description: 'Free, confidential support for anyone in suicidal crisis or emotional distress. Spanish available.',
        tags: ['suicide', 'crisis', 'general', 'spanish'],
        crisis: true
      }),
      entry('Crisis Text Line', {
        text: 'HOME to 741741',
        chat: 'https://www.crisistextline.org',
        hours: '24/7',
        description: 'Text-based crisis counseling for any type of crisis. Trained volunteer crisis counselors respond.',
        tags: ['text', 'crisis', 'general', 'youth', 'adult'],
        crisis: true
      }),
      entry('National Suicide Prevention Lifeline (legacy number)', {
        phone: '1-800-273-8255',
        hours: '24/7',
        description: 'The ten-digit predecessor to 988. Still active and routes to the same network.',
        tags: ['suicide', 'crisis', 'general'],
        crisis: true
      }),
      entry('SAMHSA National Helpline', {
        phone: '1-800-662-4357',
        text: '435748 (HELP4U)',
        hours: '24/7',
        description: 'Treatment referral and information for mental health and substance use concerns. English and Spanish.',
        tags: ['mental health', 'substance use', 'referral'],
        crisis: false
      })
    ],

    // 2. DOMESTIC VIOLENCE AND ABUSE
    domesticViolence: [
      entry('National Domestic Violence Hotline', {
        phone: '1-800-799-7233',
        text: 'START to 88788',
        chat: 'https://www.thehotline.org',
        hours: '24/7',
        description: 'Confidential advocacy, safety planning, and referrals. Interpreter services in 170 or more languages.',
        tags: ['domestic violence', 'abuse', 'safety planning', 'spanish'],
        crisis: true
      }),
      entry('love is respect (teen dating abuse)', {
        phone: '1-866-331-9474',
        text: 'LOVEIS to 22522',
        chat: 'https://www.loveisrespect.org',
        hours: '24/7',
        description: 'Support for teens and young adults ages 13 to 26 facing dating abuse. TTY available.',
        tags: ['teen', 'dating violence', 'abuse', 'youth'],
        crisis: true
      }),
      entry('StrongHearts Native Helpline', {
        phone: '1-844-762-8483 (1-844-7NATIVE)',
        chat: 'https://www.strongheartshelpline.org',
        hours: '24/7',
        description: 'Culturally appropriate domestic and dating violence support for Native Americans.',
        tags: ['domestic violence', 'native american', 'indigenous', 'abuse'],
        crisis: true
      }),
      entry('National Domestic Violence Hotline (Deaf services)', {
        phone: '1-855-812-1001 (videophone)',
        email: 'deafhelp@thehotline.org',
        hours: '24/7',
        description: 'Videophone and TTY services for Deaf and hard of hearing survivors.',
        tags: ['deaf', 'domestic violence', 'accessibility'],
        crisis: true
      })
    ],

    // 3. SEXUAL ASSAULT
    sexualAssault: [
      entry('RAINN National Sexual Assault Hotline', {
        phone: '1-800-656-4673',
        text: 'HOPE to 64673',
        chat: 'https://rainn.org/hotline',
        hours: '24/7',
        description: 'Confidential support for survivors of sexual violence, in partnership with more than 1,000 local providers.',
        tags: ['sexual assault', 'rape', 'abuse', 'survivor'],
        crisis: true
      }),
      entry('RAINN (Signal)', {
        chat: 'Signal messaging to RAINN',
        hours: '24/7',
        description: 'Encrypted messaging access to RAINN support specialists through the Signal app.',
        tags: ['sexual assault', 'encrypted', 'privacy'],
        crisis: true,
        note: 'End to end encrypted. Confirm availability on rainn.org before relying on it.'
      }),
      entry('DoD Safe Helpline', {
        phone: '1-877-995-5247',
        chat: 'https://safehelpline.org',
        hours: '24/7',
        description: 'Sexual assault support for members of the U.S. military and their families.',
        tags: ['military', 'sexual assault', 'DoD'],
        crisis: true
      }),
      entry('National Human Trafficking Hotline', {
        phone: '1-888-373-7888',
        text: '233733',
        chat: 'https://humantraffickinghotline.org',
        email: 'help@humantraffickinghotline.org',
        hours: '24/7',
        description: 'Confidential support and tip reporting in more than 200 languages. TTY through 711.',
        tags: ['trafficking', 'exploitation', 'abuse'],
        crisis: true
      })
    ],

    // 4. LGBTQ+ CRISIS
    lgbtq: [
      entry('The Trevor Project', {
        phone: '1-866-488-7386',
        text: 'START to 678678',
        chat: 'https://www.thetrevorproject.org',
        hours: '24/7',
        description: 'Crisis intervention and suicide prevention for LGBTQ young people under 25.',
        tags: ['LGBTQ', 'youth', 'suicide', 'crisis'],
        crisis: true
      }),
      entry('Trans Lifeline', {
        phone: '1-877-565-8860',
        hours: '24/7',
        description: 'Peer support hotline staffed by transgender people for transgender people.',
        tags: ['transgender', 'peer support', 'crisis'],
        crisis: true
      }),
      entry('GLBT National Hotline', {
        phone: '1-888-843-4564',
        hours: 'Mon to Fri 4pm to midnight ET, Sat noon to 5pm ET',
        description: 'Support, information, and referrals for the LGBTQ+ community and allies.',
        tags: ['LGBTQ', 'referral', 'support'],
        crisis: false
      })
    ],

    // 5. VETERANS AND MILITARY
    veterans: [
      entry('Veterans Crisis Line', {
        phone: '988 then press 1',
        text: '838255',
        chat: 'https://veteranscrisisline.net',
        hours: '24/7',
        description: 'Confidential crisis support for veterans, service members, National Guard, Reserve, and their families. No VA enrollment required.',
        tags: ['veterans', 'military', 'suicide', 'crisis'],
        crisis: true
      }),
      entry('Veterans Crisis Line (overseas)', {
        phone: 'Command specific, see description',
        chat: 'https://veteranscrisisline.net',
        hours: '24/7',
        description: 'PACOM +1-844-702-5493. EUCOM +1-844-702-5495. CENTCOM +1-855-422-7719. AFRICOM +1-888-482-6054. SOUTHCOM +1-866-989-9599.',
        tags: ['veterans', 'military', 'overseas'],
        crisis: true,
        note: 'On base, dial DSN 988.'
      }),
      entry('Military OneSource', {
        phone: '1-800-342-9647',
        hours: '24/7',
        description: 'Support for military families, including counseling referrals.',
        tags: ['military', 'family', 'referral'],
        crisis: false
      })
    ],

    // 6. YOUTH AND TEENS
    youth: [
      entry('Boys Town National Hotline', {
        phone: '1-800-448-3000',
        text: 'VOICE to 20121',
        email: 'hotline@boystown.org',
        hours: '24/7',
        description: 'Crisis counseling for children, teens, and parents. Accredited by the American Association of Suicidology. Spanish and more than 100 languages.',
        tags: ['youth', 'teen', 'parenting', 'suicide', 'crisis'],
        crisis: true
      }),
      entry('National Runaway Safeline', {
        phone: '1-800-786-2929 (1-800-RUNAWAY)',
        text: '66008',
        chat: 'https://1800runaway.org',
        hours: '24/7',
        description: 'Crisis intervention, message relay, and free bus tickets home for runaway and homeless youth.',
        tags: ['runaway', 'homeless', 'youth', 'family'],
        crisis: true
      }),
      entry('Childhelp National Child Abuse Hotline', {
        phone: '1-800-422-4453 (1-800-4-A-CHILD)',
        text: '1-800-422-4453',
        chat: 'https://www.childhelphotline.org',
        hours: '24/7',
        description: 'Crisis counselors for child abuse, neglect, and maltreatment. More than 170 languages.',
        tags: ['child abuse', 'neglect', 'children', 'crisis'],
        crisis: true
      }),
      entry('Teen Lifeline', {
        phone: '602-248-8336',
        hours: '24/7',
        description: 'Peer counseling for teens, based in Arizona.',
        tags: ['teen', 'peer support', 'suicide', 'arizona'],
        crisis: true
      }),
      entry('National Grad Crisis Line', {
        phone: '1-877-472-3457 (1-877-GRAD-HLP)',
        hours: '24/7',
        description: 'Crisis support for graduate students.',
        tags: ['graduate student', 'student', 'crisis'],
        crisis: true
      }),
      entry('Steve Fund crisis text line', {
        text: 'STEVE to 741741',
        hours: '24/7',
        description: 'Crisis text support focused on the mental health of young people of color.',
        tags: ['students of color', 'youth', 'text', 'crisis'],
        crisis: true
      })
    ],

    // 7. SUBSTANCE USE AND ADDICTION
    substanceUse: [
      entry('SAMHSA National Helpline', {
        phone: '1-800-662-4357',
        text: '435748',
        hours: '24/7',
        description: 'Free, confidential treatment referral for mental health and substance use concerns. English and Spanish.',
        tags: ['substance use', 'addiction', 'treatment', 'referral'],
        crisis: false
      }),
      entry('Partnership to End Addiction', {
        phone: '1-855-378-4373',
        text: 'CONNECT to 55753',
        hours: '24/7',
        description: 'One to one help for parents concerned about a child\'s substance use.',
        tags: ['parent', 'addiction', 'substance use', 'family'],
        crisis: false
      }),
      entry('Alcohol and Drug Helpline', {
        phone: '1-800-923-4357',
        text: 'Recovery to 839863',
        hours: '24/7',
        description: 'Support and referral for alcohol and drug concerns.',
        tags: ['addiction', 'substance use', 'alcohol', 'drugs'],
        crisis: false
      })
    ],

    // 8. EATING DISORDERS
    eatingDisorders: [
      entry('National Alliance for Eating Disorders Helpline', {
        phone: '1-866-662-1235',
        chat: 'https://www.allianceforeatingdisorders.com',
        hours: 'Mon to Fri 9am to 7pm ET',
        description: 'Staffed by licensed therapists who specialise in eating disorders. Support and referrals to all levels of treatment.',
        tags: ['eating disorder', 'anorexia', 'bulimia', 'body image', 'referral'],
        crisis: false,
        note: 'The former NEDA number 1-800-931-2237 redirects here. NEDA closed its own helpline in June 2023.'
      }),
      entry('NEDA text support (through Crisis Text Line)', {
        text: 'NEDA to 741741',
        hours: '24/7',
        description: 'Text support for eating disorder concerns, answered by Crisis Text Line counselors.',
        tags: ['eating disorder', 'text', 'crisis'],
        crisis: true
      }),
      entry('ANAD Helpline', {
        phone: '1-888-375-7767',
        hours: 'Mon to Fri 9am to 5pm CT',
        description: 'National Association of Anorexia Nervosa and Associated Disorders. Peer support and referrals.',
        tags: ['eating disorder', 'support', 'peer support'],
        crisis: false
      }),
      entry('Butterfly National Helpline (Australia)', {
        phone: '1800 33 4673',
        chat: 'https://butterfly.org.au',
        hours: 'Daily 8am to midnight AEDT',
        description: 'Support for eating disorders and body image concerns in Australia.',
        tags: ['eating disorder', 'australia', 'body image'],
        country: 'AU',
        crisis: false
      })
    ],

    // 9. POSTPARTUM AND MATERNAL MENTAL HEALTH
    postpartum: [
      entry('National Maternal Mental Health Hotline', {
        phone: '1-833-852-6262 (1-833-TLC-MAMA)',
        text: '1-833-852-6262',
        hours: '24/7',
        description: 'Free, confidential support before, during, and after pregnancy. English, Spanish, and more than 60 languages.',
        tags: ['postpartum', 'pregnancy', 'maternal health', 'perinatal'],
        crisis: false
      }),
      entry('Postpartum Support International', {
        phone: '1-800-944-4773',
        text: 'Help to 800-944-4773 (English), 971-203-7773 (Spanish)',
        hours: 'Messages returned 8am to 11pm ET daily',
        description: 'Peer support, a provider directory, and weekly online support groups.',
        tags: ['postpartum', 'peer support', 'support group'],
        crisis: false,
        note: 'Not a crisis line. Leave a message and a volunteer returns your call.'
      })
    ],

    // 10. SELF-HARM
    selfHarm: [
      entry('S.A.F.E. Alternatives', {
        phone: '1-800-366-8288',
        chat: 'https://selfinjury.com',
        hours: 'Business hours, message service after hours',
        description: 'Information line for referrals and support specific to self-injury.',
        tags: ['self-harm', 'cutting', 'referral'],
        crisis: false
      }),
      entry('Crisis Text Line (self-harm)', {
        text: 'HOME to 741741',
        hours: '24/7',
        description: 'Text based support for urges to self-harm.',
        tags: ['self-harm', 'text', 'crisis'],
        crisis: true
      })
    ],

    // 11. DISASTER AND TRAUMA
    disaster: [
      entry('Disaster Distress Helpline', {
        phone: '1-800-985-5990',
        text: '1-800-985-5990',
        hours: '24/7',
        description: 'Crisis counseling for distress related to natural or human caused disasters. More than 100 languages.',
        tags: ['disaster', 'trauma', 'mass violence', 'wildfire', 'hurricane'],
        crisis: true
      }),
      entry('Disaster Distress Helpline (ASL videophone)', {
        phone: '1-800-985-5990 (videophone or relay)',
        chat: 'https://www.samhsa.gov/find-help/disaster-distress-helpline',
        hours: '24/7',
        description: 'ASL fluent counselors available by videophone for Deaf and hard of hearing callers.',
        tags: ['disaster', 'deaf', 'ASL', 'trauma'],
        crisis: true
      })
    ],

    // 12. GRIEF AND LOSS
    grief: [
      entry('The Compassionate Friends', {
        phone: '1-877-969-0010',
        hours: 'Mon to Fri 9am to 5pm ET',
        description: 'Peer led grief support after the death of a child. Local chapters nationwide.',
        tags: ['grief', 'child loss', 'bereavement', 'peer support'],
        crisis: false
      }),
      entry('Dougy Center', {
        phone: '1-866-775-5683',
        hours: 'Mon to Fri 9am to 5pm PT',
        description: 'Grief support resources for grieving children, teens, and families.',
        tags: ['grief', 'children', 'teen', 'bereavement'],
        crisis: false
      }),
      entry('Hospice Foundation of America', {
        phone: '1-800-854-3402',
        hours: 'Mon to Fri 9am to 5pm ET',
        description: 'Education and support for those coping with terminal illness, death, and grief.',
        tags: ['grief', 'hospice', 'bereavement'],
        crisis: false
      })
    ],

    // 13. HUMAN TRAFFICKING
    trafficking: [
      entry('National Human Trafficking Hotline', {
        phone: '1-888-373-7888',
        text: '233733',
        chat: 'https://humantraffickinghotline.org',
        email: 'help@humantraffickinghotline.org',
        hours: '24/7',
        description: 'Confidential support, safety planning, and tip reporting in more than 200 languages.',
        tags: ['trafficking', 'exploitation', 'safety'],
        crisis: true
      }),
      entry('National Center for Missing & Exploited Children', {
        phone: '1-800-843-5678 (1-800-THE-LOST)',
        hours: '24/7',
        description: 'Report missing children and child sexual exploitation.',
        tags: ['missing children', 'exploitation', 'child safety'],
        crisis: true
      })
    ],

    // 14. ELDER ABUSE AND FRAUD
    elderAbuse: [
      entry('Eldercare Locator', {
        phone: '1-800-677-1116',
        hours: 'Mon to Fri 9am to 8pm ET',
        description: 'Connects older adults and caregivers to local resources, including elder abuse reporting.',
        tags: ['elder abuse', 'neglect', 'seniors', 'referral'],
        crisis: false
      }),
      entry('National Elder Fraud Hotline', {
        phone: '1-833-372-8311 (1-833-FRAUD-11)',
        hours: 'Mon to Fri 10am to 6pm ET',
        description: 'Report financial fraud and scams targeting older adults.',
        tags: ['elder fraud', 'scams', 'financial abuse'],
        crisis: false
      })
    ],

    // 15. PROBLEM GAMBLING
    gambling: [
      entry('National Problem Gambling Helpline', {
        phone: '1-800-697-3738 (1-800-MY-RESET)',
        text: '1-800-697-3738',
        chat: 'https://www.ncpgambling.org/chat',
        hours: '24/7',
        description: 'Confidential support and referral to local services, through a network of contact centers covering all fifty states.',
        tags: ['gambling', 'addiction', 'referral'],
        crisis: false,
        note: 'Adopted as the national number in January 2026. The former number 1-800-522-4700 remains active.'
      }),
      entry('National Problem Gambling Helpline (former number)', {
        phone: '1-800-522-4700',
        chat: 'https://www.ncpgambling.org/chat',
        hours: '24/7',
        description: 'Still active, and reaches the same National Problem Gambling Helpline Network.',
        tags: ['gambling', 'addiction'],
        crisis: false
      })
    ],

    // 16. DEAF AND HARD OF HEARING
    deaf: [
      entry('Deaf Crisis Line (DeafLEAD)', {
        phone: '321-800-3323 (videophone)',
        text: 'HAND to 839863',
        chat: 'https://www.deaflead.org',
        hours: '24/7',
        description: 'ASL fluent crisis counselors for Deaf, hard of hearing, and ASL users. Domestic violence, mental health, child abuse, elder abuse.',
        tags: ['deaf', 'ASL', 'crisis', 'domestic violence', 'mental health'],
        crisis: true
      }),
      entry('988 Lifeline (Deaf and hard of hearing)', {
        phone: '988 (videophone or relay)',
        text: '988',
        chat: 'https://988lifeline.org',
        hours: '24/7',
        description: 'The 988 Lifeline reachable by videophone, text, and chat for Deaf and hard of hearing users.',
        tags: ['deaf', 'suicide', 'crisis', 'accessibility'],
        crisis: true
      }),
      entry('National Domestic Violence Hotline (Deaf)', {
        phone: '1-855-812-1001 (videophone)',
        email: 'deafhelp@thehotline.org',
        hours: '24/7',
        description: 'Videophone and email support for Deaf survivors of domestic violence.',
        tags: ['deaf', 'domestic violence', 'accessibility'],
        crisis: true
      })
    ],

    // 17. WARM LINES (NON-CRISIS PEER SUPPORT)
    warmLines: [
      entry('NAMI HelpLine', {
        phone: '1-800-950-6264',
        text: 'NAMI to 62640',
        chat: 'https://nami.org/help',
        hours: 'Mon to Fri 10am to 10pm ET',
        description: 'Peer support information and resource referrals for mental health conditions.',
        tags: ['mental health', 'peer support', 'referral', 'NAMI'],
        crisis: false,
        note: 'Not a crisis line.'
      }),
      entry('NAMI Teen and Young Adult HelpLine', {
        phone: '1-800-950-6264 (option 3)',
        text: 'Friend to 62640',
        hours: 'Mon to Fri 10am to 10pm ET',
        description: 'Peer support for teens and young adults.',
        tags: ['teen', 'youth', 'peer support', 'mental health'],
        crisis: false
      }),
      entry('NAMI Family Caregiver HelpLine', {
        phone: '1-800-950-6264 (option 4)',
        text: 'Family to 62640',
        hours: 'Mon to Fri 10am to 10pm ET',
        description: 'Support for family members and caregivers of people living with mental health conditions.',
        tags: ['caregiver', 'family', 'peer support'],
        crisis: false
      }),
      entry('California Peer-Run Warm Line', {
        phone: '1-855-845-7415',
        hours: '24/7',
        description: 'Non-crisis peer emotional support, open to anyone in California.',
        tags: ['peer support', 'warm line', 'california'],
        crisis: false
      }),
      entry('Michigan Peer Warm Line', {
        phone: '1-888-733-7753',
        hours: 'Daily 10am to 2am ET',
        description: 'Peer support line for Michigan residents.',
        tags: ['peer support', 'warm line', 'michigan'],
        crisis: false
      }),
      entry('Illinois Warm Line', {
        phone: '1-866-359-7953',
        hours: 'Mon to Sat 8am to 8pm CT',
        description: 'Peer support for Illinois residents.',
        tags: ['peer support', 'warm line', 'illinois'],
        crisis: false
      })
    ],

    // 18. UNITED KINGDOM
    uk: [
      entry('Samaritans', {
        phone: '116 123',
        email: 'jo@samaritans.org',
        hours: '24/7',
        description: 'Free, confidential emotional support across the UK and Ireland. The number does not appear on phone bills.',
        tags: ['suicide', 'crisis', 'UK', 'Ireland'],
        country: 'UK',
        crisis: true
      }),
      entry('Samaritans Welsh language line', {
        phone: '0808 164 0123',
        hours: 'Daily 7pm to 11pm',
        description: 'Emotional support in Welsh.',
        tags: ['welsh', 'UK', 'crisis'],
        country: 'UK',
        crisis: true
      }),
      entry('SANEline', {
        phone: '0300 304 7000',
        hours: 'Daily 4:30pm to 10pm',
        description: 'Out of hours mental health helpline for anyone affected by mental illness.',
        tags: ['mental health', 'UK', 'support'],
        country: 'UK',
        crisis: false
      }),
      entry('National Suicide Prevention Helpline UK', {
        phone: '0800 689 5652',
        hours: 'Daily 6pm to midnight',
        description: 'Supportive listening for anyone with thoughts of suicide.',
        tags: ['suicide', 'UK', 'crisis'],
        country: 'UK',
        crisis: true
      }),
      entry('CALM, the Campaign Against Living Miserably', {
        phone: '0800 58 58 58',
        chat: 'https://www.thecalmzone.net',
        hours: 'Daily 5pm to midnight',
        description: 'Support for anyone affected by suicide or suicidal thoughts, with a particular reach among men.',
        tags: ['suicide', 'UK', 'men'],
        country: 'UK',
        crisis: true
      }),
      entry('Shout', {
        text: 'SHOUT to 85258',
        hours: '24/7',
        description: 'Confidential text service for anyone in crisis in the UK.',
        tags: ['text', 'UK', 'crisis'],
        country: 'UK',
        crisis: true
      }),
      entry('Papyrus HOPELINE247', {
        phone: '0800 068 4141',
        text: '07860 039967',
        email: 'pat@papyrus-uk.org',
        hours: '24/7',
        description: 'Suicide prevention for people under 35 and for anyone concerned about a young person.',
        tags: ['suicide', 'youth', 'UK', 'under 35'],
        country: 'UK',
        crisis: true
      }),
      entry('Switchboard LGBTQ+ Helpline', {
        phone: '0800 0119 100',
        email: 'chris@switchboard.lgbt',
        chat: 'https://switchboard.lgbt',
        hours: 'Daily 10am to 10pm',
        description: 'LGBTQ+ helpline. Every operator identifies as LGBT+.',
        tags: ['LGBTQ', 'UK', 'peer support'],
        country: 'UK',
        crisis: false
      }),
      entry('Childline', {
        phone: '0800 1111',
        chat: 'https://www.childline.org.uk',
        hours: '24/7',
        description: 'Counseling for children and young people up to age 19.',
        tags: ['children', 'youth', 'UK', 'counseling'],
        country: 'UK',
        crisis: true
      }),
      entry('C.A.L.L. Wales', {
        phone: '0800 132 737',
        text: 'help to 81066',
        hours: '24/7',
        description: 'Community Advice and Listening Line for Wales.',
        tags: ['wales', 'UK', 'mental health'],
        country: 'UK',
        crisis: false
      })
    ],

    // 19. CANADA
    canada: [
      entry('988 Suicide Crisis Helpline', {
        phone: '988',
        text: '988',
        hours: '24/7',
        description: 'Canada\'s national three digit suicide prevention line. Phone and text, English and French.',
        tags: ['suicide', 'canada', 'crisis'],
        country: 'CA',
        crisis: true
      }),
      entry('Kids Help Phone', {
        phone: '1-800-668-6868',
        text: 'CONNECT to 686868',
        chat: 'https://kidshelpphone.ca',
        hours: '24/7',
        description: 'National bilingual counseling service for children and youth.',
        tags: ['youth', 'canada', 'counseling'],
        country: 'CA',
        crisis: true
      }),
      entry('Hope for Wellness Helpline', {
        phone: '1-855-242-3310',
        chat: 'https://www.hopeforwellness.ca',
        hours: '24/7',
        description: 'Culturally competent emotional support and crisis intervention for Indigenous peoples across Canada. Cree, Ojibway, and Inuktitut on request.',
        tags: ['indigenous', 'canada', 'crisis', 'first nations'],
        country: 'CA',
        crisis: true
      }),
      entry('Trans Lifeline (Canada)', {
        phone: '1-877-330-6366',
        hours: '24/7',
        description: 'Peer support for transgender people in Canada.',
        tags: ['transgender', 'canada', 'peer support'],
        country: 'CA',
        crisis: false
      }),
      entry('Indian Residential Schools Crisis Line', {
        phone: '1-866-925-4419',
        hours: '24/7',
        description: 'Emotional support and crisis referral for former Residential School students and their families.',
        tags: ['indigenous', 'canada', 'residential schools', 'trauma'],
        country: 'CA',
        crisis: true
      }),
      entry('ConnexOntario', {
        phone: '1-866-531-2600',
        hours: '24/7',
        description: 'Information on addiction, mental health, and problem gambling services in Ontario.',
        tags: ['ontario', 'addiction', 'mental health', 'referral'],
        country: 'CA',
        crisis: false
      })
    ],

    // 20. AUSTRALIA
    australia: [
      entry('Lifeline Australia', {
        phone: '13 11 14',
        text: '0477 13 11 14',
        chat: 'https://www.lifeline.org.au',
        hours: '24/7',
        description: 'Crisis counseling and suicide prevention.',
        tags: ['suicide', 'australia', 'crisis'],
        country: 'AU',
        crisis: true
      }),
      entry('Suicide Call Back Service', {
        phone: '1300 659 467',
        hours: '24/7',
        description: 'Support for people feeling suicidal, and for those caring for someone who is.',
        tags: ['suicide', 'australia', 'crisis'],
        country: 'AU',
        crisis: true
      }),
      entry('Beyond Blue', {
        phone: '1300 22 4636',
        chat: 'https://www.beyondblue.org.au',
        hours: '24/7',
        description: 'Support for depression and anxiety.',
        tags: ['depression', 'anxiety', 'australia'],
        country: 'AU',
        crisis: false
      }),
      entry('Kids Helpline', {
        phone: '1800 55 1800',
        chat: 'https://kidshelpline.com.au',
        hours: '24/7',
        description: 'Free counseling for young people aged 5 to 25.',
        tags: ['youth', 'australia', 'counseling', 'children'],
        country: 'AU',
        crisis: true
      }),
      entry('1800RESPECT', {
        phone: '1800 737 732',
        text: '0458 737 732',
        chat: 'https://www.1800respect.org.au',
        hours: '24/7',
        description: 'National sexual assault, domestic and family violence counseling service.',
        tags: ['sexual assault', 'domestic violence', 'australia'],
        country: 'AU',
        crisis: true
      }),
      entry('MensLine Australia', {
        phone: '1300 78 99 78',
        chat: 'https://mensline.org.au',
        hours: '24/7',
        description: 'Support for men with family and relationship concerns.',
        tags: ['men', 'australia', 'relationships', 'family'],
        country: 'AU',
        crisis: false
      }),
      entry('Gambling Help Online', {
        phone: '1800 858 858',
        chat: 'https://www.gamblinghelponline.org.au',
        hours: '24/7',
        description: 'Counseling and support for problem gambling in Australia.',
        tags: ['gambling', 'australia', 'addiction'],
        country: 'AU',
        crisis: false
      })
    ]
  };

  function tagged(e, cat) {
    var o = {}, k;
    for (k in e) { if (Object.prototype.hasOwnProperty.call(e, k)) o[k] = e[k]; }
    o._category = cat;
    return o;
  }

  var LABELS = {
    suicideCrisis: 'Suicide and crisis',
    domesticViolence: 'Domestic violence and abuse',
    sexualAssault: 'Sexual assault',
    lgbtq: 'LGBTQ+',
    veterans: 'Veterans and military',
    youth: 'Youth and teens',
    substanceUse: 'Substance use',
    eatingDisorders: 'Eating disorders',
    postpartum: 'Pregnancy and postpartum',
    selfHarm: 'Self-harm',
    disaster: 'Disaster and trauma',
    grief: 'Grief and loss',
    trafficking: 'Human trafficking',
    elderAbuse: 'Elder abuse and fraud',
    gambling: 'Problem gambling',
    deaf: 'Deaf and hard of hearing',
    warmLines: 'Warm lines',
    uk: 'United Kingdom',
    canada: 'Canada',
    australia: 'Australia'
  };

  return {
    version: '1.0.1',
    reviewed: '2026-08-08',
    categories: Object.keys(DIR),
    label: function (cat) { return LABELS[cat] || cat; },

    all: function () {
      var out = [];
      Object.keys(DIR).forEach(function (cat) {
        DIR[cat].forEach(function (e) { out.push(tagged(e, cat)); });
      });
      return out;
    },

    byCategory: function (cat) {
      return (DIR[cat] || []).map(function (e) { return tagged(e, cat); });
    },

    crisisOnly: function () {
      return this.all().filter(function (e) { return e.crisis; });
    },

    byCountry: function (code) {
      var c = (code || 'US').toUpperCase();
      return this.all().filter(function (e) { return (e.country || 'US') === c; });
    },

    search: function (q) {
      var term = (q || '').trim().toLowerCase();
      if (!term) return [];
      return this.all().filter(function (e) {
        return (e.name + ' ' + e.tags.join(' ') + ' ' + e.description).toLowerCase().indexOf(term) !== -1;
      });
    },

    entries: DIR
  };
}));
