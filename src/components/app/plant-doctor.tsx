'use client';

import { handleDiagnose, handleRecommend } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowRight, Bot, CheckCircle, Leaf, Pill, Sparkles, UploadCloud, XCircle, TestTube2, Sprout, Info } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Diagnosis = {
  diseaseName: string;
  confidence: number;
  description: string;
};

type Treatment = {
  chemicalTreatment: string;
  biologicalTreatment: string;
  chemicalMedicines: string;
  biologicalMedicines: string;
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
         <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Leaf className="text-primary w-6 h-6" />
              </div>
              <span className="text-xl font-bold">Bắt đầu chẩn đoán</span>
            </CardTitle>
            <CardDescription>Tải lên ảnh rõ nét của bộ phận cây bị bệnh để AI phân tích.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <ImageUploader onDiagnose={onDiagnose} isPending={isDiagnosisPending} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ảnh đã tải lên</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && (
                   <Image src={imagePreview} alt="Xem trước cây trồng" width={400} height={400} className="rounded-lg object-cover w-full aspect-square shadow-md" data-ai-hint="plant disease" />
                )}
              </CardContent>
               <CardFooter className="flex justify-center">
                 <Button variant="outline" onClick={resetState} disabled={isLoading}>
                    {isLoading ? 'Đang xử lý...' : 'Bắt đầu chẩn đoán mới'}
                  </Button>
               </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-3 space-y-8">
            <Card className="overflow-hidden shadow-lg">
               <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Bot className="text-primary w-5 h-5" />
                  </div>
                  <span className="font-bold">Kết quả &amp; Hướng điều trị</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {isDiagnosisPending ? <DiagnosisSkeleton /> : diagnosis ? <DiagnosisResult diagnosis={diagnosis} /> : null}
                {isTreatmentPending ? <TreatmentSkeleton /> : treatment ? <TreatmentPlan treatment={treatment} /> : (isDiagnosisPending ? <Skeleton className="h-4 w-48"/> : <p className="text-muted-foreground">Đang chờ kết quả chẩn đoán...</p>)}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUploader({ onDiagnose, isPending }: { onDiagnose: (file: File) => void, isPending: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDiagnose(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onDiagnose(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div 
      className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 ease-in-out bg-card"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
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
        <div className="bg-primary/10 p-4 rounded-full border-8 border-primary/5">
          <UploadCloud className="h-10 w-10 text-primary" />
        </div>
        <p className="font-semibold text-lg">Kéo và thả ảnh vào đây</p>
        <p className="text-muted-foreground">hoặc</p>
        <Button disabled={isPending} size="lg">Nhấp để chọn tệp</Button>
        <p className="text-xs text-muted-foreground mt-2">Hỗ trợ PNG, JPG, và WEBP. Kích thước tối đa 5MB.</p>
      </div>
    </div>
  );
}

function DiagnosisResult({ diagnosis }: { diagnosis: Diagnosis }) {
  const confidencePercent = Math.round(diagnosis.confidence * 100);
  
  const getConfidenceIcon = (confidence: number) => {
    if (confidence > 75) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (confidence > 50) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  }

  return (
    <div className="space-y-6">
      <Alert variant={confidencePercent < 50 ? 'destructive' : 'default'} className="bg-card border-2">
        {getConfidenceIcon(confidencePercent)}
        <AlertTitle className="font-bold text-xl">{diagnosis.diseaseName}</AlertTitle>
        <AlertDescription className="text-base">
          AI đã xác định bệnh này với độ tin cậy là {confidencePercent}%.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-6">
        <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Mô tả chi tiết
            </h4>
            <p className="text-muted-foreground text-base whitespace-pre-wrap pl-7 leading-relaxed">{diagnosis.description}</p>
        </div>

        <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Mức độ tin cậy
            </h4>
            <div className="flex items-center gap-4 pl-7">
                <Progress value={confidencePercent} className="w-full h-3" />
                <span className="text-lg font-bold text-foreground">{confidencePercent}%</span>
            </div>
        </div>
      </div>
    </div>
  );
}


function TreatmentPlan({ treatment }: { treatment: Treatment }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <TestTube2 className="text-blue-600 dark:text-blue-400 h-5 w-5" />
          </div>
          <h4 className="font-bold text-lg text-blue-800 dark:text-blue-300">Điều trị hóa học</h4>
        </div>
        <p className="text-muted-foreground whitespace-pre-wrap mb-4 text-base leading-relaxed">{treatment.chemicalTreatment}</p>
        <div>
          <h5 className="font-semibold flex items-center gap-2 text-primary mb-2"><Pill className="h-5 w-5" /> Thuốc đề xuất</h5>
          <p className="text-muted-foreground whitespace-pre-wrap pl-7 text-base leading-relaxed">{treatment.chemicalMedicines}</p>
        </div>
      </div>

       <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
            <Sprout className="text-green-600 dark:text-green-400 h-5 w-5" />
          </div>
          <h4 className="font-bold text-lg text-green-800 dark:text-green-300">Điều trị sinh học</h4>
        </div>
        <p className="text-muted-foreground whitespace-pre-wrap mb-4 text-base leading-relaxed">{treatment.biologicalTreatment}</p>
        <div>
            <h5 className="font-semibold flex items-center gap-2 text-primary mb-2"><Pill className="h-5 w-5" /> Thuốc đề xuất</h5>
            <p className="text-muted-foreground whitespace-pre-wrap pl-7 text-base leading-relaxed">{treatment.biologicalMedicines}</p>
          </div>
      </div>
    </div>
  );
}


function DiagnosisSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/4 mb-4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </div>
       <div className="space-y-3">
        <Skeleton className="h-5 w-1/4 mb-4" />
        <Skeleton className="h-5 w-full" />
      </div>
    </div>
  );
}

function TreatmentSkeleton() {
  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-3 p-4 border rounded-lg">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-3 p-4 border rounded-lg">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

    