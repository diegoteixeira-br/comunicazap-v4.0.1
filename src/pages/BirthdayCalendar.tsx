import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, Cake, Calendar as CalendarIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contact {
  id: string;
  name: string | null;
  phone_number: string;
  birthday: string | null;
}

const BirthdayCalendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone_number, birthday')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .not('birthday', 'is', null);

      if (error) throw error;

      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getBirthdaysForDay = (day: Date) => {
    const dayMonth = day.getMonth() + 1; // 1-12
    const dayDate = day.getDate();
    
    return contacts.filter(contact => {
      if (!contact.birthday) return false;
      const [, month, dayStr] = contact.birthday.split('-');
      return parseInt(month) === dayMonth && parseInt(dayStr) === dayDate;
    });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate starting day offset (0 = Sunday, 6 = Saturday)
  const startDayOffset = getDay(monthStart);

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleImportBirthdays = (day: Date) => {
    const birthdaysToday = getBirthdaysForDay(day);
    
    if (birthdaysToday.length === 0) {
      toast({
        title: "Nenhum aniversariante",
        description: "Não há aniversariantes neste dia",
        variant: "destructive"
      });
      return;
    }

    // Converter para o formato esperado pela página Results
    const clients = birthdaysToday.map(contact => ({
      "Nome do Cliente": contact.name || contact.phone_number,
      "Telefone do Cliente": contact.phone_number
    }));

    // Salvar no sessionStorage
    sessionStorage.setItem("clientData", JSON.stringify(clients));
    
    toast({
      title: "Aniversariantes importados!",
      description: `${clients.length} contato(s) importado(s) para nova campanha`,
    });

    // Navegar para a página de resultados
    navigate("/results");
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const totalBirthdaysThisMonth = contacts.filter(contact => {
    if (!contact.birthday) return false;
    const [, month] = contact.birthday.split('-');
    return parseInt(month) === currentMonth.getMonth() + 1;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/contacts")}
            className="mb-3 sm:mb-4"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Voltar aos Contatos</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
                <Cake className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Calendário de Aniversários
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Visualize todos os aniversários dos seus contatos
              </p>
            </div>
            <Button onClick={goToToday} variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ir para Hoje</span>
              <span className="sm:hidden">Hoje</span>
            </Button>
          </div>
        </div>

        {/* Month Stats */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={previousMonth}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-[160px] sm:min-w-[200px]">
                  <h2 className="text-lg sm:text-2xl font-bold capitalize">
                    {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Badge variant="secondary" className="text-xs sm:text-lg px-2 py-1 sm:px-4 sm:py-2">
                <Cake className="mr-1 sm:mr-2 h-3 w-3 sm:h-5 sm:w-5" />
                {totalBirthdaysThisMonth} aniversário(s)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Calendário Mensal</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Clique em um dia para ver os aniversariantes
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-[10px] sm:text-sm p-1 sm:p-2 text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from({ length: startDayOffset }).map((_, index) => (
                  <div key={`empty-${index}`} className="p-2" />
                ))}

                {/* Calendar days */}
                {daysInMonth.map((day) => {
                  const birthdaysToday = getBirthdaysForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const hasBirthdays = birthdaysToday.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-[70px] sm:min-h-[100px] p-1 sm:p-2 border rounded transition-all
                        ${isToday ? 'border-primary border-2 bg-primary/5' : 'border-border'}
                        ${hasBirthdays ? 'bg-secondary/30 hover:bg-secondary/50' : 'hover:bg-accent'}
                        cursor-pointer relative
                      `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] sm:text-sm font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {hasBirthdays && (
                          <Badge variant="default" className="text-[8px] sm:text-xs h-4 sm:h-5 px-1 sm:px-2">
                            <Cake className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            {birthdaysToday.length}
                          </Badge>
                        )}
                      </div>
                      
                      {hasBirthdays && (
                        <>
                          <div className="space-y-0.5 sm:space-y-1 mt-1 sm:mt-2 mb-1 sm:mb-2 hidden sm:block">
                            {birthdaysToday.slice(0, 2).map((contact) => (
                              <div
                                key={contact.id}
                                className="text-[10px] sm:text-xs p-0.5 sm:p-1 bg-background/50 rounded truncate"
                                title={contact.name || contact.phone_number}
                              >
                                🎂 {contact.name || contact.phone_number.slice(-4)}
                              </div>
                            ))}
                            {birthdaysToday.length > 2 && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground text-center">
                                +{birthdaysToday.length - 2} mais
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full text-[8px] sm:text-xs h-5 sm:h-7 px-1 sm:px-2"
                            onClick={() => handleImportBirthdays(day)}
                          >
                            <Upload className="h-2 w-2 sm:h-3 sm:w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Importar</span>
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Birthday List for Current Month */}
        {!loading && contacts.filter(c => {
          if (!c.birthday) return false;
          const [, month] = c.birthday.split('-');
          return parseInt(month) === currentMonth.getMonth() + 1;
        }).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Aniversariantes de {format(currentMonth, "MMMM", { locale: ptBR })}</CardTitle>
              <CardDescription>
                Lista completa de todos os aniversariantes do mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contacts
                  .filter(c => {
                    if (!c.birthday) return false;
                    const [, month] = c.birthday.split('-');
                    return parseInt(month) === currentMonth.getMonth() + 1;
                  })
                  .sort((a, b) => {
                    const [, , dayA] = a.birthday!.split('-');
                    const [, , dayB] = b.birthday!.split('-');
                    return parseInt(dayA) - parseInt(dayB);
                  })
                  .map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Cake className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {contact.name || contact.phone_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {contact.phone_number}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {contact.birthday!.split('-').slice(1).reverse().join('/')}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BirthdayCalendar;
