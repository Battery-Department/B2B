'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { Shield, Settings, X } from 'lucide-react';
import { ConsentPreferences } from '@/services/privacy/consent-manager';

interface ConsentBannerProps {
  onConsent: (preferences: ConsentPreferences) => void;
  onDecline: () => void;
  required?: boolean;
}

export function ConsentBanner({ onConsent, onDecline, required = false }: ConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: true,
    marketing: false,
    personalization: true,
    thirdPartySharing: false,
    dataRetention: 'standard',
    communicationChannels: {
      email: true,
      sms: false,
      push: false
    }
  });

  useEffect(() => {
    // Check if consent already given
    const existingConsent = localStorage.getItem('lithiai_consent');
    if (existingConsent && !required) {
      setShowBanner(false);
    }
  }, [required]);

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      analytics: true,
      marketing: true,
      personalization: true,
      thirdPartySharing: true,
      dataRetention: 'extended',
      communicationChannels: {
        email: true,
        sms: true,
        push: true
      }
    };
    
    localStorage.setItem('lithiai_consent', JSON.stringify(allAccepted));
    onConsent(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('lithiai_consent', JSON.stringify(preferences));
    onConsent(preferences);
    setShowBanner(false);
  };

  const handleDeclineAll = () => {
    if (!required) {
      const minimal: ConsentPreferences = {
        analytics: false,
        marketing: false,
        personalization: false,
        thirdPartySharing: false,
        dataRetention: 'minimum',
        communicationChannels: {
          email: false,
          sms: false,
          push: false
        }
      };
      
      localStorage.setItem('lithiai_consent', JSON.stringify(minimal));
      onDecline();
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="text-primary mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold">Privacy & Cookie Preferences</h3>
                <p className="text-sm text-default-600 mt-1">
                  We use cookies and similar technologies to enhance your experience, analyze site usage, and deliver personalized content.
                  You can customize your preferences below.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="flat"
                onPress={() => setShowDetails(true)}
                startContent={<Settings size={16} />}
              >
                Customize
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="default"
                onPress={handleDeclineAll}
                isDisabled={required}
              >
                Decline All
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={handleAcceptAll}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showDetails} 
        onClose={() => setShowDetails(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            Privacy Preferences Center
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Essential Cookies</h4>
                  <p className="text-sm text-default-600 mb-3">
                    Always active. These cookies are necessary for the website to function and cannot be switched off.
                  </p>
                  <Checkbox isSelected isDisabled>
                    Essential Cookies
                  </Checkbox>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Analytics Cookies</h4>
                  <p className="text-sm text-default-600 mb-3">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                  <Checkbox
                    isSelected={preferences.analytics}
                    onValueChange={(checked) => setPreferences({
                      ...preferences,
                      analytics: checked
                    })}
                  >
                    Enable Analytics Cookies
                  </Checkbox>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Marketing Cookies</h4>
                  <p className="text-sm text-default-600 mb-3">
                    These cookies are used to deliver advertisements more relevant to you and your interests.
                  </p>
                  <Checkbox
                    isSelected={preferences.marketing}
                    onValueChange={(checked) => setPreferences({
                      ...preferences,
                      marketing: checked
                    })}
                  >
                    Enable Marketing Cookies
                  </Checkbox>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Personalization</h4>
                  <p className="text-sm text-default-600 mb-3">
                    Allow us to personalize your experience based on your preferences and behavior.
                  </p>
                  <Checkbox
                    isSelected={preferences.personalization}
                    onValueChange={(checked) => setPreferences({
                      ...preferences,
                      personalization: checked
                    })}
                  >
                    Enable Personalization
                  </Checkbox>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Third-Party Data Sharing</h4>
                  <p className="text-sm text-default-600 mb-3">
                    Share data with trusted partners to enhance advertising effectiveness and audience insights.
                  </p>
                  <Checkbox
                    isSelected={preferences.thirdPartySharing}
                    onValueChange={(checked) => setPreferences({
                      ...preferences,
                      thirdPartySharing: checked
                    })}
                  >
                    Allow Third-Party Sharing
                  </Checkbox>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Communication Preferences</h4>
                  <p className="text-sm text-default-600 mb-3">
                    Choose how you'd like to receive communications from us.
                  </p>
                  <div className="space-y-2">
                    <Checkbox
                      isSelected={preferences.communicationChannels.email}
                      onValueChange={(checked) => setPreferences({
                        ...preferences,
                        communicationChannels: {
                          ...preferences.communicationChannels,
                          email: checked
                        }
                      })}
                    >
                      Email Communications
                    </Checkbox>
                    <Checkbox
                      isSelected={preferences.communicationChannels.sms}
                      onValueChange={(checked) => setPreferences({
                        ...preferences,
                        communicationChannels: {
                          ...preferences.communicationChannels,
                          sms: checked
                        }
                      })}
                    >
                      SMS Messages
                    </Checkbox>
                    <Checkbox
                      isSelected={preferences.communicationChannels.push}
                      onValueChange={(checked) => setPreferences({
                        ...preferences,
                        communicationChannels: {
                          ...preferences.communicationChannels,
                          push: checked
                        }
                      })}
                    >
                      Push Notifications
                    </Checkbox>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h4 className="font-semibold mb-2">Data Retention</h4>
                  <p className="text-sm text-default-600 mb-3">
                    Choose how long we retain your data.
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="retention"
                        checked={preferences.dataRetention === 'minimum'}
                        onChange={() => setPreferences({
                          ...preferences,
                          dataRetention: 'minimum'
                        })}
                      />
                      <span className="text-sm">Minimum (90 days)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="retention"
                        checked={preferences.dataRetention === 'standard'}
                        onChange={() => setPreferences({
                          ...preferences,
                          dataRetention: 'standard'
                        })}
                      />
                      <span className="text-sm">Standard (1 year)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="retention"
                        checked={preferences.dataRetention === 'extended'}
                        onChange={() => setPreferences({
                          ...preferences,
                          dataRetention: 'extended'
                        })}
                      />
                      <span className="text-sm">Extended (2 years)</span>
                    </label>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setShowDetails(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => {
                handleAcceptSelected();
                setShowDetails(false);
              }}
            >
              Save Preferences
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}