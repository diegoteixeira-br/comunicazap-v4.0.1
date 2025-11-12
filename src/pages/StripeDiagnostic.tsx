import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const StripeDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('diagnostic-stripe', {
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (error) {
        toast.error('Erro ao executar diagnóstico: ' + error.message);
        return;
      }

      setDiagnostics(data);
      toast.success('Diagnóstico executado com sucesso!');
    } catch (error) {
      toast.error('Erro ao executar diagnóstico');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ value }: { value: boolean | string }) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      );
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico Stripe</CardTitle>
          <CardDescription>
            Verificar configuração da chave Stripe, autenticação e CORS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostic} disabled={loading}>
            {loading ? 'Executando...' : 'Executar Diagnóstico'}
          </Button>

          {diagnostics && (
            <div className="space-y-6 mt-6">
              {/* Stripe Config */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <StatusIcon value={diagnostics.stripe?.key_configured} />
                  Configuração Stripe
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chave NOVA configurada:</span>
                    <span className="font-mono">{diagnostics.stripe?.key_configured ? 'SIM' : 'NÃO'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sufixo da chave NOVA:</span>
                    <span className="font-mono">{diagnostics.stripe?.key_suffix}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prefixo da chave NOVA:</span>
                    <span className="font-mono">{diagnostics.stripe?.key_prefix}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chave ANTIGA existe:</span>
                    <span className="font-mono">{diagnostics.stripe?.old_key_exists ? 'SIM' : 'NÃO'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sufixo da chave ANTIGA:</span>
                    <span className="font-mono">{diagnostics.stripe?.old_key_suffix}</span>
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <StatusIcon value={diagnostics.authentication?.valid_token} />
                  Autenticação
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Header presente:</span>
                    <span className="font-mono">{diagnostics.authentication?.header_present ? 'SIM' : 'NÃO'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token válido:</span>
                    <span className="font-mono">{diagnostics.authentication?.valid_token ? 'SIM' : 'NÃO'}</span>
                  </div>
                  {diagnostics.authentication?.user_email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-mono">{diagnostics.authentication.user_email}</span>
                    </div>
                  )}
                  {diagnostics.authentication?.error && (
                    <div className="text-red-500 text-xs mt-2">
                      Erro: {diagnostics.authentication.error}
                    </div>
                  )}
                </div>
              </div>

              {/* CORS */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <StatusIcon value={diagnostics.cors?.headers_configured} />
                  CORS
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Headers configurados:</span>
                    <span className="font-mono">{diagnostics.cors?.headers_configured ? 'SIM' : 'NÃO'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origin:</span>
                    <span className="font-mono text-xs">{diagnostics.cors?.origin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-mono">{diagnostics.cors?.method}</span>
                  </div>
                </div>
              </div>

              {/* Environment */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Variáveis de Ambiente</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supabase URL:</span>
                    <span className="font-mono">{diagnostics.environment?.supabase_url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Role Key:</span>
                    <span className="font-mono">{diagnostics.environment?.service_role_key}</span>
                  </div>
                </div>
              </div>

              {/* Raw JSON */}
              <details className="border rounded-lg p-4">
                <summary className="font-semibold cursor-pointer">JSON Completo</summary>
                <pre className="mt-3 text-xs overflow-auto bg-muted p-3 rounded">
                  {JSON.stringify(diagnostics, null, 2)}
                </pre>
              </details>

              <div className="text-xs text-muted-foreground">
                Timestamp: {diagnostics.timestamp}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeDiagnostic;
