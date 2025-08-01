'use client';

import React, { useCallback, useState, useTransition } from 'react';
import Image from 'next/image';
import { Bot, CheckCircle, Info, Leaf, Pill, RefreshCw, ShieldAlert, Sparkles, Sprout, TestTube2, UploadCloud, AlertCircle, ChevronDown, Trees } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleDiagnose, handleRecommend } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Diagnosis = {
  plantName: string;
  diseaseName: string;
  confidence: number;
  description: string;
};

type Medicine = {
  name: string;
  hazardLevel: 'Ít nguy hiểm' | 'Nguy hiểm trung bình' | 'Rất nguy hiểm';
};

type Treatment = {
  chemicalTreatment: string;
  biologicalTreatment: string;
  chemicalMedicines: Medicine[];
  biologicalMedicines: Medicine[];
};

export function PlantDoctor() {
  const { toast } = useToast();
  const [isDiagnosisPending, startDiagnosisTransition] = useTransition();
  const [isTreatmentPending, startTreatmentTransition] = useTransition();
  
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [showUploader, setShowUploader] = useState(true);

  const resetState = useCallback(() => {
    setError(null);
    setImagePreview(null);
    setDiagnosis(null);
    setTreatment(null);
    setShowUploader(true);
  }, []);

  const onGetTreatment = useCallback((diag: Diagnosis) => {
    if (!diag) return;
    startTreatmentTransition(async () => {
      const result = await handleRecommend(diag.diseaseName, diag.description);
      if ('error' in result) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Đề xuất thất bại",
          description: result.error,
        });
      } else {
        setTreatment(result);
      }
    });
  }, [startTreatmentTransition, toast]);


  const onDiagnose = (file: File) => {
    resetState();
    setShowUploader(false);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);
      startDiagnosisTransition(async () => {
        const result = await handleDiagnose(dataUri);
        if ('error' in result) {
          setError(result.error);
           toast({
            variant: "destructive",
            title: "Chẩn đoán thất bại",
            description: result.error,
          });
          setShowUploader(true);
        } else {
          setDiagnosis(result);
          onGetTreatment(result);
        }
      });
    };
    reader.onerror = (error) => {
      console.error('Lỗi đọc tệp:', error);
      setError('Không thể đọc tệp ảnh.');
       toast({
        variant: "destructive",
        title: "Lỗi tệp",
        description: 'Đã có sự cố khi đọc tệp ảnh của bạn.',
      });
      setShowUploader(true);
    };
  };

  const isLoading = isDiagnosisPending || isTreatmentPending;

  return (
    <div className="space-y-8">
      {showUploader ? (
         <ImageUploaderCard onDiagnose={onDiagnose} isPending={isDiagnosisPending} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ảnh chẩn đoán</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && (
                   <Image src={imagePreview} alt="Xem trước cây trồng" width={400} height={400} className="rounded-lg object-cover w-full aspect-square shadow-md" data-ai-hint="plant disease" />
                )}
              </CardContent>
               <CardFooter className="flex justify-center">
                 <Button className="w-full" onClick={resetState} disabled={isLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {isLoading ? 'Đang xử lý...' : 'Bắt đầu chẩn đoán mới'}
                  </Button>
               </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden shadow-lg">
               <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Bot className="text-primary w-7 h-7" />
                  <span className="font-bold">Kết quả Phân tích & Hướng điều trị</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {isDiagnosisPending ? <DiagnosisSkeleton /> : diagnosis ? <DiagnosisResult diagnosis={diagnosis} /> : null}
                {isLoading ? <TreatmentSkeleton /> : treatment ? <TreatmentPlan treatment={treatment} /> : (diagnosis && !isDiagnosisPending) ? <TreatmentSkeleton /> : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ImageUploaderCard({ onDiagnose, isPending }: { onDiagnose: (file: File) => void, isPending: boolean }) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onDiagnose(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onDiagnose(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto border-primary/20">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Leaf className="text-primary w-6 h-6" />
          <span>Bắt đầu chẩn đoán</span>
        </CardTitle>
        <CardDescription>Tải lên ảnh rõ nét của bộ phận cây bị bệnh để AI phân tích.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div 
          className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 ease-in-out bg-card"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isPending && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isPending}
          />
          <div className="flex flex-col items-center gap-4 text-foreground">
            <div className="p-4 bg-primary/10 rounded-full border-8 border-primary/5">
                <UploadCloud className="h-12 w-12 text-primary" />
            </div>
            <p className="font-semibold text-lg">Kéo và thả ảnh hoặc</p>
            <Button disabled={isPending} size="lg">
              {isPending ? 'Đang xử lý...' : 'Chọn tệp từ thiết bị'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Hỗ trợ PNG, JPG, WEBP. Tối đa 5MB.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function DiagnosisResult({ diagnosis }: { diagnosis: Diagnosis }) {
  const confidencePercent = Math.round(diagnosis.confidence * 100);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence > 85) return "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300";
    if (confidence > 60) return "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
    return "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300";
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-card border-none shadow-none p-0">
        <CardHeader className="p-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-primary/10 p-2.5 rounded-lg border border-primary/20 shadow-inner">
                <Trees className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardDescription className="text-sm font-medium text-muted-foreground">Tên cây</CardDescription>
              <CardTitle className="text-2xl font-bold text-primary">{diagnosis.plantName}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 shadow-inner">
                <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <CardDescription className="text-sm font-medium text-muted-foreground">Chẩn đoán bệnh</CardDescription>
              <CardTitle className="text-2xl font-bold text-destructive">{diagnosis.diseaseName}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-6 space-y-4">
          <Alert className={cn("border-2 shadow-sm", getConfidenceBadge(confidencePercent))}>
            <Sparkles className="h-5 w-5" />
            <AlertTitle className="font-semibold">Độ tin cậy của AI: {confidencePercent}%</AlertTitle>
            <AlertDescription>
              <Progress value={confidencePercent} className="w-full h-2 mt-2" />
            </AlertDescription>
          </Alert>
          
          <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Mô tả chi tiết
            </h4>
            <p className="text-muted-foreground text-base whitespace-pre-wrap pl-7 leading-relaxed">{diagnosis.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function MedicineCard({ medicine }: { medicine: Medicine }) {
  const hazardClasses = {
    'Ít nguy hiểm': 'bg-green-100/80 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    'Nguy hiểm trung bình': 'bg-yellow-100/80 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    'Rất nguy hiểm': 'bg-red-100/80 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  };

  const HazardIcon = ({ level }: { level: string }) => {
    if (level === 'Rất nguy hiểm') return <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />;
    if (level === 'Nguy hiểm trung bình') return <ShieldAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
  };

  return (
     <Card className={cn("p-3 shadow-sm flex items-center gap-3 border", hazardClasses[medicine.hazardLevel])}>
        <div className="p-2 bg-card rounded-md">
            <Pill className="h-5 w-5 flex-shrink-0" />
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-sm">{medicine.name}</p>
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            <HazardIcon level={medicine.hazardLevel} />
            <span>{medicine.hazardLevel}</span>
          </div>
        </div>
      </Card>
  );
}

function TreatmentPlan({ treatment }: { treatment: Treatment }) {
  return (
    <div className="space-y-4 border-t border-dashed pt-6">
      <Accordion type="multiple" className="w-full space-y-4" defaultValue={['chemical-treatment', 'biological-treatment']}>
        <AccordionItem value="chemical-treatment" className="border rounded-lg bg-card shadow-sm">
          <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-3">
              <TestTube2 className="h-6 w-6" />
              Điều trị hóa học
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-2">
            <div className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">{treatment.chemicalTreatment}</p>
              <div>
                <h5 className="font-semibold mb-3">Thuốc gợi ý:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {treatment.chemicalMedicines.map((med, index) => <MedicineCard key={`chem-${index}`} medicine={med} />)}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="biological-treatment" className="border rounded-lg bg-card shadow-sm">
          <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline text-green-800 dark:text-green-300">
            <div className="flex items-center gap-3">
              <Sprout className="h-6 w-6" />
              Điều trị sinh học
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-2">
             <div className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">{treatment.biologicalTreatment}</p>
              <div>
                <h5 className="font-semibold mb-3">Thuốc gợi ý:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {treatment.biologicalMedicines.map((med, index) => <MedicineCard key={`bio-${index}`} medicine={med} />)}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}


function DiagnosisSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-56" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="space-y-3 pt-2">
        <Skeleton className="h-5 w-1/4 mb-4 rounded-md" />
        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-5 w-5/6 rounded-md" />
      </div>
    </div>
  );
}

function TreatmentSkeleton() {
  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
       <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
