import React, { useCallback, useEffect } from 'react';
import { Button } from 'components/common/Button/Button';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import formSchema from 'components/Wizard/schema';

import * as S from './WizardForm.styled';
import KafkaCluster from './KafkaCluster/KafkaCluster';
import Authentication from './Authentication/Authentication';

const securityProtocolOptions = [
  {
    value: 'none',
    label: 'None',
  },
  {
    value: 'sasl_ssl',
    label: 'SASL_SSL',
  },
  {
    value: 'sasl_plaintext',
    label: 'SASL_PLAINTEXT',
  },
];
const options = [
  {
    value: 'none',
    label: 'None',
  },
  {
    value: 'sasl_jaas',
    label: 'SASL_JAAS',
  },
  {
    value: 'sasl_gssapi',
    label: 'SASL_GSSAPI',
  },
  {
    value: 'sasl_oauthbearer',
    label: 'SASL_OAUTHBEARER',
  },
  {
    value: 'sasl_plain',
    label: 'SASL_PLAIN',
  },
  {
    value: 'sasl_scram-256',
    label: 'SASL_SCRAM-256',
  },
  {
    value: 'sasl_scram-512',
    label: 'SASL_SCRAM-512',
  },
  {
    value: 'Delegation_token',
    label: 'Delegation_token',
  },
  {
    value: 'sasl_ldap',
    label: 'SASL_LDAP',
  },
  {
    value: 'sasl_aws_iam',
    label: 'SASL_AWS_IAM',
  },
  {
    value: 'mtls',
    label: 'mTLS',
  },
];
export interface IOption {
  value: string;
  label: string;
}
type BootstrapServersType = {
  host: string;
  port: string;
};
export type FormValues = {
  clusterName: string;
  readOnly: boolean;
  bootstrapServers: BootstrapServersType[];
  saslType: string;
};
const Wizard: React.FC = () => {
  const methods = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(formSchema),
    defaultValues: {
      clusterName: '',
      readOnly: false,
      bootstrapServers: [{ host: '', port: '' }],
    },
  });

  const { control } = methods;
  const { fields, append, remove } = useFieldArray<
    FormValues,
    'bootstrapServers'
  >({
    control,
    name: 'bootstrapServers',
  });

  const handleAddNewProperty = useCallback(() => {
    if (
      methods.getValues().bootstrapServers.every((prop) => {
        return prop.host;
      })
    ) {
      append({ host: '', port: '' });
    }
  }, []);
  const getValue = (value: string, optionsType: IOption[]) => {
    const val = value
      ? optionsType.find((option) => option.value === value)
      : '';
    return val?.toString();
  };
  const onSubmit = (data: unknown) => {
    console.log('SubmitData', data);
  };
  useEffect(() => {
    const subscription = methods.watch((data) => console.log(data));
    return subscription.unsubscribe;
  }, [methods.watch]);
  return (
    <div style={{ padding: '15px' }}>
      <Button
        style={{ marginBottom: '0.75rem' }}
        buttonSize="M"
        buttonType="primary"
      >
        Back
      </Button>
      <hr />
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <KafkaCluster
            handleAddNewProperty={handleAddNewProperty}
            fields={fields}
            remove={remove}
          />
          <Authentication
            getValue={getValue}
            options={options}
            securityProtocolOptions={securityProtocolOptions}
          />
          <S.Section>
            <S.SectionName className="text-lg font-medium leading-6 text-gray-900">
              Schema Registry
            </S.SectionName>
            <div className="md:mt-0 md:col-span-3">
              <div className="sm:overflow-hidden h-full">
                <div className="px-4 py-5">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-5">
                      <Button buttonSize="M" buttonType="primary">
                        Add Schema Registry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </S.Section>
          <S.Section>
            <S.SectionName className="text-lg font-medium leading-6 text-gray-900">
              Kafka Connect
            </S.SectionName>
            <div className="md:mt-0 md:col-span-3">
              <div className="sm:overflow-hidden h-full">
                <div className="px-4 py-5">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-5">
                      <Button buttonSize="M" buttonType="primary">
                        Add Kafka Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </S.Section>
          <S.Section>
            <S.SectionName className="text-lg font-medium leading-6 text-gray-900">
              JMX Metrics
            </S.SectionName>
            <div className="md:mt-0 md:col-span-3">
              <div className="sm:overflow-hidden h-full">
                <div className="px-4 py-5">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-5">
                      <Button buttonSize="M" buttonType="primary">
                        Configure JMX Metrics
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </S.Section>
          <div style={{ paddingTop: '10px' }}>
            <div
              style={{
                justifyContent: 'center',
                display: 'flex',
              }}
            >
              <Button buttonSize="M" buttonType="primary">
                Cancel
              </Button>
              <Button
                style={{ marginLeft: '15px' }}
                type="submit"
                buttonSize="M"
                buttonType="primary"
              >
                Save
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default Wizard;
